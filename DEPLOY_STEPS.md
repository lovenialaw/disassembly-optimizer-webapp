# 🚀 Deployment Steps: Heroku + GitHub Pages

## Step 1: Deploy Backend to Heroku

### 1.1 Install Heroku CLI
Download from: https://devcenter.heroku.com/articles/heroku-cli

### 1.2 Login to Heroku
```bash
heroku login
```

### 1.3 Create Heroku App
```bash
heroku create disassembly-optimizer-api
# Or use your own name: heroku create your-app-name
```

**Save your app URL!** Example: `https://disassembly-optimizer-api.herokuapp.com`

### 1.4 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.5 Deploy to Heroku
```bash
git push heroku main
# If main branch doesn't work, try:
# git push heroku master
```

### 1.6 Test Backend
Visit: `https://your-app-name.herokuapp.com/api/health`

Should see: `{"status":"healthy","message":"Disassembly Optimizer API is running"}`

---

## Step 2: Deploy Frontend to GitHub Pages

### 2.1 Install gh-pages
```bash
cd frontend
npm install --save-dev gh-pages
```

### 2.2 Update package.json
Add `homepage` field (replace with your GitHub username and repo):

```json
{
  "homepage": "https://yourusername.github.io/disassembly-optimizer",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 2.3 Set Production API URL
Create `frontend/.env.production`:

```bash
cd frontend
echo REACT_APP_API_URL=https://your-app-name.herokuapp.com/api > .env.production
```

**Replace `your-app-name` with your actual Heroku app name!**

### 2.4 Build and Deploy
```bash
npm run deploy
```

This will:
1. Build your React app
2. Create `gh-pages` branch
3. Push to GitHub

### 2.5 Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. **Source:** Select `gh-pages` branch
4. Click **Save**

### 2.6 Access Your App
Your app will be available at:
`https://yourusername.github.io/disassembly-optimizer`

---

## Quick Commands Reference

### Backend (Heroku)
```bash
# Deploy updates
git add .
git commit -m "Update"
git push heroku main

# View logs
heroku logs --tail

# Check status
heroku ps
```

### Frontend (GitHub Pages)
```bash
cd frontend

# Deploy updates
npm run deploy

# Build only (test)
npm run build
```

---

## Environment Variables

### Development (Local)
Create `frontend/.env.development.local`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Production (GitHub Pages)
Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-app-name.herokuapp.com/api
```

---

## Troubleshooting

### Heroku Issues

**"No app specified"**
```bash
heroku git:remote -a your-app-name
```

**"Module not found"**
- Make sure `requirements.txt` is in root directory
- Check Procfile is correct

**"Application error"**
```bash
heroku logs --tail
```

### GitHub Pages Issues

**404 Error**
- Check `homepage` in package.json matches your GitHub Pages URL
- Verify `gh-pages` branch exists

**API not working**
- Check browser console for errors
- Verify `.env.production` has correct Heroku URL
- Make sure Heroku app is running

---

## File Structure for Deployment

```
disassembly-optimizer/
├── app.py                 # Root app for Heroku
├── Procfile              # Heroku process file
├── requirements.txt      # Python dependencies (root)
├── runtime.txt          # Python version
├── backend/
│   ├── app.py          # Main Flask app
│   └── ...
├── frontend/
│   ├── package.json    # With homepage and deploy scripts
│   ├── .env.production # Production API URL
│   └── ...
└── data/               # CSV, metadata, GLTF files
```

---

## ✅ Checklist

- [ ] Heroku CLI installed
- [ ] Heroku app created
- [ ] Backend deployed to Heroku
- [ ] Backend health check works
- [ ] GitHub repository created
- [ ] gh-pages installed
- [ ] package.json updated with homepage
- [ ] .env.production created with Heroku URL
- [ ] Frontend deployed to GitHub Pages
- [ ] GitHub Pages enabled in repository settings
- [ ] Frontend loads and connects to Heroku API

---

## Need Help?

- **Heroku Docs:** https://devcenter.heroku.com/
- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **React Deployment:** https://create-react-app.dev/docs/deployment/

