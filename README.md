# Zara Virtual Try-On Application

A web application that allows users to upload photos of themselves and generate virtual try-on compositions with clothing items using AI-powered processing through n8n workflows and Replicate.

## Features

- Upload user photos (JPG/PNG up to 10MB)
- Browse clothing catalog or enter direct product image URLs
- Integration with n8n workflows for AI processing
- Real-time job status tracking and polling
- Results gallery with download and sharing capabilities
- Fallback to placeholder results when external services are unavailable

## Architecture

- **Frontend**: React 18 + TypeScript with Vite
- **Backend**: Express.js with TypeScript
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query
- **Storage**: In-memory storage (MemStorage) for development
- **External Integration**: n8n webhooks + Replicate AI models

## Setup Instructions

### Prerequisites

- Node.js 20+
- n8n instance (optional, for production AI processing)
- Replicate API account (optional, for production AI processing)

### Environment Variables

Create a `.env` file in the root directory:

```bash
# n8n Integration (optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/tryon

# Replicate API (optional, used within n8n workflow)
REPLICATE_API_TOKEN=r8_your_replicate_api_token_here

# Webhook Security (recommended for production)
WEBHOOK_SECRET=your_webhook_secret_for_verification
```

### Installation & Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## API Endpoints

### POST /api/upload
Upload user photo files.

**Request**: Multipart form data with `photo` field
**Response**: `{ assetId, url, filename, size }`

### GET /api/products
Get clothing products with optional filtering.

**Query Parameters**: 
- `category` (optional): Filter by category
- `gender` (optional): Filter by gender
- `search` (optional): Search in title/description

**Response**: `{ items: Product[] }`

### POST /api/tryon
Create a virtual try-on job.

**Request Body**:
```json
{
  "assetUrl": "https://example.com/user-photo.jpg",
  "productImageUrl": "https://example.com/product.jpg",
  "mode": "image"
}
```

**Response**: `{ jobId: string }`

### GET /api/jobs/:id
Poll job status and progress.

**Response**: 
```json
{
  "status": "queued|processing|succeeded|failed",
  "resultUrls": ["https://result-url.jpg"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/webhooks/tryon
Webhook endpoint for n8n callbacks.

**Request Body**:
```json
{
  "jobId": "uuid",
  "resultUrl": "https://result-image-url.jpg", 
  "status": "succeeded"
}
```

### GET /api/results/:id
Get complete results for a job.

**Response**:
```json
{
  "originalUrl": "/api/uploads/uuid",
  "resultUrls": ["https://result-url.jpg"],
  "products": [{ Product }],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## n8n Workflow Configuration

### Webhook Trigger Node
Configure a webhook node to receive POST requests with this JSON structure:
```json
{
  "jobId": "uuid-string",
  "assetUrl": "https://user-photo-url.jpg",
  "productImageUrl": "https://product-image-url.jpg"
}
```

### Replicate Nodes
1. **Person Segmentation**: Use a model like "cjwbw/rembg" to remove background
2. **Virtual Try-On**: Use VTON models available on Replicate
3. **Alternative**: Use segmentation + garment warping + composition pipeline

### Example n8n Workflow Steps

1. **Webhook Trigger** - Receives job data from your app
2. **HTTP Request** - Download images from provided URLs  
3. **Replicate Node** - Process virtual try-on
   - Input: User photo + product image
   - Output: Composed result image
4. **File Upload** - Upload result to your storage (S3/etc)
5. **HTTP Request** - POST result back to `/api/webhooks/tryon`

### Sample Replicate Models
- Virtual Try-On: `cjwbw/image-virtual-try-on`
- Person Segmentation: `cjwbw/rembg`
- Pose Estimation: `rmokady/clip_prefix_caption`

### Callback Configuration
Configure the final HTTP Request node in your n8n workflow:

**URL**: `https://your-app.com/api/webhooks/tryon`
**Method**: POST
**Body**:
```json
{
  "jobId": "{{ $node['Webhook'].json.jobId }}",
  "resultUrl": "{{ $node['Upload_Result'].json.url }}",
  "status": "succeeded"
}
```

## Usage Flow

1. **Upload Photo**: User uploads a selfie or photo
2. **Select Product**: Choose from catalog or enter product image URL
3. **Generate**: Submit for processing via n8n workflow
4. **Results**: View virtual try-on composition

## Development Notes

### Product Source Modes

The application currently uses:
- **Mode A** (Active): Pre-provided product catalog in `data/products.json`
- **Mode B** (Future): Zara scraper integration (to be implemented with proper TOS compliance)

### Fallback Behavior

When n8n or external services are unavailable:
- System automatically falls back to placeholder result generation
- Uses curated placeholder images to demonstrate functionality
- Maintains same user experience and API contract

### Storage Interface

The `IStorage` interface in `server/storage.ts` is designed to be pluggable:
- Current: `MemStorage` for development
- Future: Database adapter for production
- Easy to swap implementations without changing business logic

## Security Considerations

- File upload validation (type, size limits)
- URL validation for external image sources
- Webhook signature verification (when WEBHOOK_SECRET is configured)
- Input sanitization and schema validation

## Testing

The application includes comprehensive test IDs for automated testing:
- Upload flow: `upload-area`, `button-upload`
- Product selection: `tab-browse`, `tab-url`, `input-product-url`
- Generation: `button-generate-tryon`
- Results: `img-result`, `button-download`, `button-share`

## Deployment

1. Set environment variables in your production environment
2. Configure n8n workflow with your production webhook URLs
3. Deploy the application using Replit Deployments
4. Update n8n webhook callback URLs to point to your deployed app

## Troubleshooting

### n8n Integration Issues
- Verify `N8N_WEBHOOK_URL` is correctly set
- Check n8n workflow is active and accessible
- Monitor server logs for webhook errors

### Processing Failures
- System automatically falls back to placeholder results
- Check Replicate API quota and permissions
- Verify image URLs are accessible from n8n workflow

### Upload Issues  
- Ensure file types are JPG/PNG and under 10MB
- Check file permissions in uploads directory
- Verify multer configuration for your environment