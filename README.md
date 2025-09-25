# NMAD-Project
NMAD Project (Never Miss A Thing) is a computer app that helps you keep track of your deadlines.

## Features

- Track entries with start and end dates
- Automatic email notifications for entries expiring within 3 days
- Test email functionality
- Cross-platform desktop application built with Electron

## Email Setup Instructions

To receive email notifications, you'll need to configure Gmail with an App Password.

### Gmail App Password Setup

#### Step 1: Enable 2-Factor Authentication (Required)
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the setup process (you'll need your phone for verification)

#### Step 2: Generate App Password
1. Go to this link [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

#### Step 3: Copy the App Password
- Google will display a 16-character password like: `abcd efgh ijkl mnop`
- **Save this password** - this is what you'll use in the app
- **Important**: This App password is used only for the FollowUpProject

#### Step 4: Configure in FollowUp Project
1. Open FollowUp Project
2. In the Email Configuration section:
   - **Service**: Select "Gmail"
   - **Sender Email**: Your full Gmail address (e.g., `yourname@gmail.com`)
   - **App Password**: Enter the 16-character code **without spaces** (e.g., `abcdefghijklmnop`)
   - **Notification Email**: Email address where you want to receive notifications
3. Click **Save Configuration**
4. Click **Test Email** to verify it works
5. Check your notification email inbox for the test message

## Installation & Usage

bash
# Install dependencies
npm install

# Development mode
npm run electron-dev

# Build for production
npm run build-electron

## How Email Notifications Work

- The app automatically checks for expiring entries every hour
- Notifications are sent for entries expiring within 3 days
- Each entry will only trigger one notification per day
- Use the "Test Email" button to verify your email configuration

## Troubleshooting

### Email Issues
- **Gmail authentication errors**: Make sure you're using an App Password, not your regular Gmail password
- **No Test Email button**: Save your email configuration first, then the button will appear
- **Only Gmail supported**: Other email providers have authentication restrictions that make them unreliable

### App Issues
- If the app doesn't start, try `npm run build` then `npm run electron`
- Check the developer console (F12) for error messages
