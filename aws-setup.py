import boto3
import os
from dotenv import load_dotenv

load_dotenv('.env')

def create_rds_instance():
    """Create RDS MySQL instance"""
    # Explicitly set AWS credentials from environment variables
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')

    if not aws_access_key or not aws_secret_key:
        print("Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env file")
        return

    # Create RDS client with explicit credentials
    rds = boto3.client(
        'rds',
        region_name='ap-southeast-5',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )

    try:
        response = rds.create_db_instance(
            DBInstanceIdentifier='flood-alert-db',
            DBInstanceClass='db.t3.micro',
            Engine='mysql',
            MasterUsername=os.getenv('RDS_USERNAME', 'root'),
            MasterUserPassword=os.getenv('RDS_PASSWORD'),
            AllocatedStorage=20,
            DBName='flood_alert',
            PubliclyAccessible=True,
            BackupRetentionPeriod=7
        )
        print(f"RDS instance created: {response['DBInstance']['Endpoint']['Address']}")
        return response
    except Exception as e:
        print(f"Error creating RDS: {e}")

if __name__ == '__main__':
    create_rds_instance()