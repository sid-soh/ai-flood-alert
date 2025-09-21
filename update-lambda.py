import boto3
import zipfile
import os
import subprocess
import shutil
from dotenv import load_dotenv

load_dotenv('.env')

def update_lambda():
    """Update Lambda function with dependencies"""
    
    # Create temp directory for dependencies
    os.makedirs('temp_lambda', exist_ok=True)
    
    # Install pymysql to temp directory
    subprocess.run([
        'pip', 'install', 'pymysql', '-t', 'temp_lambda'
    ], check=True)
    
    # Copy Lambda files
    shutil.copy('lambda/api_handler.py', 'temp_lambda/')
    shutil.copy('data/rds_connector.py', 'temp_lambda/')
    
    # Create deployment package
    with zipfile.ZipFile('lambda-update.zip', 'w') as zip_file:
        for root, dirs, files in os.walk('temp_lambda'):
            for file in files:
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, 'temp_lambda')
                zip_file.write(file_path, arc_name)
    
    # Update Lambda function
    lambda_client = boto3.client(
        'lambda',
        region_name='ap-southeast-5',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    try:
        with open('lambda-update.zip', 'rb') as zip_file:
            response = lambda_client.update_function_code(
                FunctionName='flood-alert-api',
                ZipFile=zip_file.read()
            )
        
        print("✓ Lambda function updated with pymysql dependency")
        
        # Cleanup
        shutil.rmtree('temp_lambda')
        os.remove('lambda-update.zip')
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    update_lambda()