# Laravel Project Manager - Production Deployment Guide

This guide will help you deploy your Laravel + React (Inertia.js) Project Manager to an Ubuntu VPS with Apache.

## Prerequisites

- Ubuntu VPS with Apache, PHP 8.2+, MySQL, Node.js installed
- Domain name pointing to your VPS IP (duan.novastars.vn)
- Access to your existing MySQL server (202.92.7.170)
- Basic knowledge of Linux command line

## Project Configuration Changes Made

The project has been configured for production hosting with the following changes:

1. **Environment Configuration**: Updated to use your external MySQL server
2. **Vite Configuration**: Optimized for production builds
3. **Security**: Enhanced .htaccess with security headers and file protection
4. **Session Management**: Configured for .novastars.vn domain
5. **Build Scripts**: Added production-specific build commands

## Deployment Steps

### Step 1: Prepare Your Local Project

1. Ensure your project is ready for production:
   ```bash
   # Test locally first
   composer install
   npm install
   npm run build:production
   php artisan config:clear
   php artisan test
   ```

2. Create a deployment package:
   ```bash
   # Exclude unnecessary files
   tar -czf project-manager-deploy.tar.gz \
     --exclude=node_modules \
     --exclude=.git \
     --exclude=storage/logs/* \
     --exclude=.env \
     .
   ```

### Step 2: Server Setup

1. Upload the server setup script to your VPS:
   ```bash
   scp deploy/server-setup.sh user@your-vps-ip:~/
   ```

2. Run the server setup script:
   ```bash
   ssh user@your-vps-ip
   chmod +x server-setup.sh
   ./server-setup.sh
   ```

3. Secure MySQL installation:
   ```bash
   sudo mysql_secure_installation
   ```

### Step 3: Deploy Application

1. Upload your project files:
   ```bash
   # Upload the deployment package
   scp project-deploy.tar.gz user@your-vps-ip:~/
   scp deploy/deploy-app.sh user@your-vps-ip:~/
   scp deploy/apache-vhost.conf user@your-vps-ip:~/
   scp deploy/production.env user@your-vps-ip:~/
   ```

2. Extract and deploy:
   ```bash
   ssh user@your-vps-ip
   
   # Extract project files
   sudo tar -xzf project-deploy.tar.gz -C /var/www/duan.novastars.vn/
   
   # Copy environment file and update it
   sudo cp production.env /var/www/duan.novastars.vn/.env
   sudo nano /var/www/duan.novastars.vn/.env  # Update database credentials
   
   # Run deployment script
   chmod +x deploy-app.sh
   ./deploy-app.sh
   ```

### Step 4: Configure Multiple Sites (if needed)

If you already have a website running on Apache, you can configure multiple virtual hosts:

1. Check existing sites:
   ```bash
   sudo apache2ctl -S
   ls /etc/apache2/sites-enabled/
   ```

2. Your new site configuration will be added alongside existing ones.

3. Make sure your DNS is properly configured for the new domain.

### Step 5: SSL Configuration

The deployment script will automatically set up SSL using Certbot:

```bash
# This is done automatically in the deployment script
sudo certbot --apache -d duan.novastars.vn
```

### Step 6: Post-Deployment

1. **Test the application**:
   - Visit https://duan.novastars.vn
   - Check all functionality
   - Monitor logs for errors

2. **Set up monitoring**:
   ```bash
   # Monitor logs
   tail -f /var/www/duan.novastars.vn/storage/logs/laravel.log
   tail -f /var/log/apache2/duan.novastars.vn_error.log
   ```

3. **Set up automated backups**:
   ```bash
   # Create backup script
   sudo crontab -e
   # Add: 0 2 * * * /path/to/backup-script.sh
   ```

## Maintenance Commands

### Update Application
```bash
cd /var/www/duan.novastars.vn
git pull origin main  # if using git
composer install --no-dev --optimize-autoloader
npm ci --production=false
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl reload apache2
```

### Clear Caches
```bash
cd /var/www/duan.novastars.vn
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Monitor Performance
```bash
# Check Apache status
sudo systemctl status apache2

# Check MySQL status
sudo systemctl status mysql

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop
```

## Troubleshooting

### Common Issues

1. **Permission errors**:
   ```bash
   sudo chown -R www-data:www-data /var/www/duan.novastars.vn
   sudo chmod -R 755 /var/www/duan.novastars.vn
   sudo chmod -R 775 /var/www/duan.novastars.vn/storage
   sudo chmod -R 775 /var/www/duan.novastars.vn/bootstrap/cache
   ```

2. **Database connection errors**:
   - Check .env database credentials
   - Verify MySQL service is running
   - Test database connection

3. **Apache configuration errors**:
   ```bash
   sudo apache2ctl configtest
   sudo systemctl status apache2
   ```

4. **SSL certificate issues**:
   ```bash
   sudo certbot renew --dry-run
   sudo certbot certificates
   ```

### Log Files
- Laravel logs: `/var/www/duan.novastars.vn/storage/logs/laravel.log`
- Apache error logs: `/var/log/apache2/duan.novastars.vn_error.log`
- Apache access logs: `/var/log/apache2/duan.novastars.vn_access.log`

## Security Considerations

1. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Configure firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **Regular backups**:
   - Database backups
   - File system backups
   - Configuration backups

4. **Monitor security logs**:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

## Support

If you encounter issues during deployment, check:
1. Server logs for specific error messages
2. Laravel logs for application errors
3. Apache configuration syntax
4. Database connectivity
5. File permissions

For additional help, provide specific error messages and log entries.
