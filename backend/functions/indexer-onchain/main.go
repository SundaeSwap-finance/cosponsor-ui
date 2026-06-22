package main

import (
	"log"
	"os"
	"slices"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/onchaindao"
	sundaecli "github.com/SundaeSwap-finance/sundae-go-utils/sundae-cli"
	syncV2Consumer "github.com/SundaeSwap-finance/sundae-go-utils/sundae-sync-v2-consumer"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/rs/zerolog"
	"github.com/urfave/cli/v2"
)

var service = sundaecli.NewService("cosponsor-indexer-onchain")

func main() {
	app := sundaecli.App(
		service,
		action,
		slices.Concat(
			sundaecli.CommonFlags,
			syncV2Consumer.CommonFlags,
		)...,
	)
	if err := app.Run(os.Args); err != nil {
		log.Fatalln(err)
	}
}

func action(c *cli.Context) error {
	logger := zerolog.New(os.Stdout)

	s := session.Must(session.NewSession(aws.NewConfig()))
	api := dynamodb.New(s)

	h := &Handler{
		logger:  logger,
		onchain: onchaindao.Build(api, sundaecli.CommonOpts.Env),
	}

	// SyncV2Consumer.Start dispatches between Lambda, raw Kinesis,
	// and single-transaction replay modes based on flags, so we
	// don't need a separate entry point for the local-debug path.
	consumer := syncV2Consumer.New(h.rollForward, h.rollBack, &logger)
	return consumer.Start(c)
}
