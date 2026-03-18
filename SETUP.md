# Setup Guide — Online Marketing Coaching App

## 1. Install dependencies
```bash
npm install
```

## 2. Set up Convex (first time only)
Run the Convex dev server — this will prompt you to log in and create a project:
```bash
npx convex dev
```
After setup, Convex will give you a deployment URL. It will automatically write it to `.env.local` as `NEXT_PUBLIC_CONVEX_URL`.

> Keep `npx convex dev` running in a terminal while developing — it syncs your schema and functions to the cloud.

## 3. Add your API key
Open `.env.local` and fill in your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## 4. Set your admin password
Also in `.env.local`, change the default admin password:
```
ADMIN_PASSWORD=your-secure-password
```

## 5. Run the dev server
In a second terminal:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the customer chat page.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

## 6. First-time admin setup
1. Go to `/admin` and log in with your `ADMIN_PASSWORD`
2. Fill in your **Knowledge Base** (who you are, your services, expertise)
3. Fill in your **Response Rules** (tone, boundaries, focus areas)
4. Set a **Customer Chat Password** (what your customers will use to access the chat)
5. Click **Save Settings**

Your customers can now go to `/` and log in with the password you set!
