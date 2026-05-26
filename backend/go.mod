module github.com/SundaeSwap-finance/cosponsor-ui/backend

go 1.24.0

toolchain go1.24.6

require (
	github.com/SundaeSwap-finance/sundae-go-utils v0.0.0-20260504200003-2c0522286f0f
	github.com/aws/aws-sdk-go v1.55.8
	github.com/blinklabs-io/gouroboros v0.132.0
	github.com/go-chi/chi/v5 v5.0.10
	github.com/gofrs/uuid v4.4.0+incompatible
	github.com/rs/zerolog v1.34.0
	github.com/savaki/ddb v0.0.0-20231021205115-8066867efca2
	github.com/urfave/cli/v2 v2.27.7
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/SundaeSwap-finance/ogmigo/v6 v6.2.1 // indirect
	github.com/aws/aws-lambda-go v1.41.0 // indirect
	github.com/awslabs/kinesis-aggregation/go v0.0.0-20220610150308-f265332d248d // indirect
	github.com/blinklabs-io/plutigo v0.0.6 // indirect
	github.com/btcsuite/btcd/btcutil v1.1.6 // indirect
	github.com/cpuguy83/go-md2man/v2 v2.0.7 // indirect
	github.com/fxamacker/cbor/v2 v2.9.0 // indirect
	github.com/go-chi/cors v1.2.1 // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/harlow/kinesis-consumer v0.3.5 // indirect
	github.com/jinzhu/copier v0.4.0 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/savaki/apigateway v0.0.0-20221128200736-ed62fddee4c2 // indirect
	github.com/utxorpc/go-codegen v0.17.0 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	github.com/xrash/smetrics v0.0.0-20240521201337-686a1a2994c1 // indirect
	golang.org/x/crypto v0.43.0 // indirect
	golang.org/x/sync v0.17.0 // indirect
	golang.org/x/sys v0.37.0 // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

replace github.com/SundaeSwap-finance/sundae-go-utils => ../../sundae-go-utils
