import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class AwsCdkFirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /// VPC

    new ec2.Vpc(this, 'awsCdkFirstVPC', {
      vpcName: 'aws-cdk-first-vpc',
      cidr: '10.0.0.0/16',
    });

    /// s3 Bucket

    const bucket = new s3.Bucket(this, 'awsCdkFirstS3Bucket', {
      bucketName: 'aws-cdk-first-s3bucket',
    });

    /// Lambda Function

    const lambdaFunction = new lambda.Function(this, 'HelloHandler', {
      functionName: 'HelloHandler',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(lambdaFunction);

    /// Api Gateway

    const api = new apigateway.RestApi(this, 'awsCdkFirstApiGateway', {
      restApiName: 'aws-cdk-first-api-gateway',
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    api.root.addMethod('GET', lambdaIntegration);

    /// SQS Queue

    const queue = new sqs.Queue(this, 'awsCdkFirstQueue', {
      queueName: 'aws-cdk-first-queue',
      retentionPeriod: Duration.days(7),
      visibilityTimeout: Duration.seconds(300),
    });

    /// SNS Topic

    const topic = new sns.Topic(this, 'awsCdkFirstTopic');

    /// SNS Subscription

    topic.addSubscription(new subs.SqsSubscription(queue));

    /// DynamoDB

    new dynamodb.Table(this, 'awsCdkFirstDynamoDb', {
      tableName: 'aws-cdk-first-dynamodb',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
    });
  }
}
