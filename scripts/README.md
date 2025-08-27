# Admin Scripts

This directory contains administrative scripts for managing the Clean Pods e-commerce application.

## Available Scripts

### admin-orders.js

**Purpose**: Securely fetch and display all orders from the database.

**Usage**:

```bash
# Set your admin key (add this to your .env.local file)
export ADMIN_ORDERS_KEY="your_secret_admin_key_here"

# Run the script
node scripts/admin-orders.js
```

**Features**:

- ✅ Secure API access using admin key
- 📊 Display order summary and details
- 💰 Show total revenue calculation
- 🔒 Token-based authentication
- 📱 Works with local development and production

**Sample Output**:

```
🔐 Admin Orders Dashboard
========================

📦 Found 3 orders:

Order #1:
  ID: order_12345
  Payment ID: pay_67890
  Customer: John Doe
  Email: john@example.com
  Phone: +1234567890
  Total: ₹599
  Items: 2 items
  Created: 1/10/2024, 3:45:30 PM
  ---------------

✅ Total orders: 3
💰 Total revenue: ₹1,347
```

## Setup

### 1. Environment Configuration

Add the admin key to your `.env.local` file:

```env
ADMIN_ORDERS_KEY=your_secret_admin_key_here
```

**Important**: Use a strong, unique key for production environments.

### 2. Server Configuration

Make sure your server is running with the same `ADMIN_ORDERS_KEY` environment variable.

### 3. For Production

If using a remote server, set the `SITE_URL` environment variable:

```bash
export SITE_URL="https://yoursite.com"
export ADMIN_ORDERS_KEY="your_secret_admin_key_here"
node scripts/admin-orders.js
```

## Security Notes

- 🔐 **Admin Key Required**: All scripts require proper authentication
- 🚫 **No Public Access**: These scripts are for authorized administrators only
- 📝 **Audit Trail**: Consider logging admin script usage in production
- 🔄 **Key Rotation**: Regularly rotate admin keys for enhanced security

## Error Handling

Common issues and solutions:

### "ADMIN_ORDERS_KEY environment variable is required"

- **Solution**: Set the `ADMIN_ORDERS_KEY` environment variable
- **Example**: `export ADMIN_ORDERS_KEY="your_key_here"`

### "HTTP 403: Access denied"

- **Solution**: Verify your admin key matches the server configuration
- **Check**: Ensure the server has the same `ADMIN_ORDERS_KEY` value

### "Connection refused" or network errors

- **Solution**: Verify the server is running and accessible
- **Check**: Confirm the `SITE_URL` is correct (defaults to `http://localhost:3000`)

## Development

To add new admin scripts:

1. Create a new `.js` file in the `scripts/` directory
2. Implement proper authentication using the admin key pattern
3. Add error handling and user-friendly output
4. Document the script in this README
5. Test with both development and production environments

## Support

For issues with admin scripts:

1. Check environment variable configuration
2. Verify server connectivity
3. Confirm admin key permissions
4. Review server logs for detailed error information
