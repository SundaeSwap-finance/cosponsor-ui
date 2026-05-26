package onchaindao

import "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

// Build constructs the on-chain document DAO for a given env.
func Build(api dynamodbiface.DynamoDBAPI, env string) *DAO {
	return New(api, TableName(env))
}

// TableName is the public table-naming convention,
// e.g. "preview-cosponsor--onchain-docs".
func TableName(env string) string {
	return env + "-cosponsor--onchain-docs"
}
