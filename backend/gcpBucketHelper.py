from google.cloud import storage


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    # bucket_name = "your-bucket-name"
    # source_file_name = "local/path/to/file"
    # destination_blob_name = "storage-object-name"
    print("upload_blob() called")
    storage_client = storage.Client()
    print("storage_client initialized")
    bucket = storage_client.bucket(bucket_name)
    print("storage_client.bucket() initialized")
    blob = bucket.blob(destination_blob_name)
    print("blob created")

    blob.upload_from_filename(source_file_name)
    print("upload_from_filename() complete")

    print(
        "File {} uploaded to {}.".format(
            source_file_name, destination_blob_name
        )
    )