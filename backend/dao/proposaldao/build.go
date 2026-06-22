package proposaldao

import "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

// Build constructs the DAO for the deployed env, e.g. "preview"
// → "preview-cosponsor--proposals".
func Build(api dynamodbiface.DynamoDBAPI, env string) *DAO {
	return New(api, TableName(env))
}

// TableName is the public table-naming convention. It is exported so
// that resources.template tests and tooling can derive the name from
// the env without duplicating the format string.
func TableName(env string) string {
	return env + "-cosponsor--proposals"
}
