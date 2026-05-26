package main

import (
	"log"
	"os"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/onchaindao"
	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
	sundaecli "github.com/SundaeSwap-finance/sundae-go-utils/sundae-cli"
	sundaerest "github.com/SundaeSwap-finance/sundae-go-utils/sundae-rest"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/go-chi/chi/v5"
	"github.com/urfave/cli/v2"
)

var service = sundaecli.NewService("cosponsor-api")

func main() {
	app := sundaecli.App(
		service,
		action,
		append(
			sundaecli.CommonFlags,
			sundaecli.PortFlag(5301),
		)...,
	)
	if err := app.Run(os.Args); err != nil {
		log.Fatalln(err)
	}
}

func action(_ *cli.Context) error {
	s := session.Must(session.NewSession(aws.NewConfig()))
	api := dynamodb.New(s)

	deps := &handlerDeps{
		proposals: proposaldao.Build(api, sundaecli.CommonOpts.Env),
		onchain:   onchaindao.Build(api, sundaecli.CommonOpts.Env),
	}

	routes := chi.NewRouter()
	sundaerest.Middlewares(service, routes)
	mountRoutes(routes, deps)

	return sundaerest.Webserver(service, routes)
}
