# AWS S3 Bucket Setup Guide for Body Tracker App

This guide covers the complete S3 setup for your body tracker app with public profile and ranking features.

## 1. Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `your-app-body-scans`)
4. Select your preferred region
5. **Uncheck "Block all public access"** (we need public read access for images)
6. Acknowledge the warning about public access
7. Create the bucket

## 2. Configure Bucket Policy (SECURE VERSION)

**DO NOT** add a public read bucket policy. Instead, we'll control access at the object level for security.

The bucket should remain private by default. Only specific images that users explicitly make public will be accessible via public URLs.

## 3. Configure CORS

Add this CORS configuration to allow uploads from your mobile app:

```json
[
	{
		"AllowedHeaders": ["*"],
		"AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
		"AllowedOrigins": ["*"],
		"ExposeHeaders": ["ETag"],
		"MaxAgeSeconds": 3000
	}
]
```

## 4. Create IAM User for API Access

1. Go to IAM Console
2. Create a new user (e.g., `airox-api-s3-user`)
3. Attach this custom policy:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"s3:PutObject",
				"s3:PutObjectAcl",
				"s3:GetObject",
				"s3:GetObjectAcl",
				"s3:DeleteObject"
			],
			"Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
		},
		{
			"Effect": "Allow",
			"Action": ["s3:ListBucket"],
			"Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
		}
	]
}
```

4. Generate Access Keys for this user
5. Save the Access Key ID and Secret Access Key

## 5. Optional: Set up CloudFront CDN

For faster global delivery of images:

1. Go to CloudFront Console
2. Create a new distribution
3. Set Origin Domain to your S3 bucket
4. Configure caching behaviors
5. Note the CloudFront domain name

## 6. Environment Variables

Add these to your backend `.env` file:

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_CLOUDFRONT_DOMAIN="your-cloudfront-domain.cloudfront.net"  # Optional
```

## 7. Folder Structure

The app will organize files in S3 like this:

```
your-bucket/
├── body-scans/
│   ├── user-id-1/
│   │   ├── 1640995200000-abc123.jpg
│   │   └── 1640995300000-def456.jpg
│   └── user-id-2/
│       └── 1640995400000-ghi789.jpg
└── profile-images/
    ├── user-id-1-profile.jpg
    └── user-id-2-profile.jpg
```

## 8. Security Considerations (ENHANCED PRIVACY)

- **Private by Default**: All images are private when uploaded
- **Opt-in Public Access**: Only images explicitly made public by users are accessible
- **Signed URLs for Private Images**: Private images use temporary signed URLs for authorized access
- **Authenticated Uploads**: Only authenticated users can upload
- **User Isolation**: Each user can only access their own uploads
- **File Validation**: Server validates file types and sizes
- **Unique Names**: Prevents filename conflicts with timestamps
- **ACL Management**: Server controls individual image visibility via S3 ACLs

### Privacy Protection for Body Images:

1. **Default Privacy**: All body scan images are private when uploaded
2. **User Control**: Users must explicitly choose to make images public for rankings
3. **Granular Control**: Users can make individual scans public while keeping others private
4. **Secure Access**: Private images are only accessible via signed URLs with expiration
5. **No Accidental Exposure**: Images cannot be accidentally made public

## 9. Cost Optimization

- Use S3 Intelligent Tiering for automatic cost optimization
- Set up lifecycle policies to move old images to cheaper storage classes
- Monitor usage with CloudWatch

## 10. Testing

Test your setup:

1. Upload an image through your app
2. Verify it appears in S3
3. Test public access by opening the image URL in a browser
4. Verify proper permissions (upload works, but unauthorized access is blocked)

## Troubleshooting

**403 Forbidden on image access:**

- Check bucket policy allows public read
- Verify the object ACL is set to public-read

**CORS errors:**

- Verify CORS configuration includes your app's domain
- Check that all required headers are allowed

**Upload failures:**

- Verify IAM user has correct permissions
- Check AWS credentials in environment variables
- Ensure bucket name is correct
