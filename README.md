# Serverless secrets

This is an example of how to leverage the AWS SSM parameter store with Lambda functions, as well as a service pattern I've been experimenting with.

I'm using the serverless framework to do the deployment orchestration.

In this example, I define a Lambda function that will be deployed to a VPC, and will be in a security group that has access to a database.

The database credentials will be securely stored in the AWS secure parameter store.

In the serverless.yml file, I've created a name spaced set of environment variables which are the names of the parameters that will be fetched from the Lambda.

That's also where other settings will be setup, like the vpc id, security groups, and so on.

Next, sample.js is the entrypoint for the lambda execution. It handles logic around routing requests to the correct functions (if you need that kind of logic).

service.js is a generic implementation of a service that contains common code used across lambda functions for things like setting up database connections, pre-populating caches, etc...

sample_service.js is extends the generic service with various bits of function specific code.

secrets.js handles asynchronous loading of the parameters from the SSM parameter store.