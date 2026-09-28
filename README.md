# VIDHI SALES — GitHub Ready Website

## Open in VS Code
1. Extract this folder.
2. Open the folder in VS Code.
3. Open `index.html` or use Live Server.

## What is included
- Professional responsive UI/UX
- 6-image hero carousel with complete images using `object-fit: contain`
- VIDHI SALES Ponda shop image and Google Maps button
- Consultant section for Vinod Naik with photo
- Product, machine, tool and service catalogue
- Fuzzy/typo-tolerant product search
- Request quotation and contact forms
- EmailJS integration with mailto fallback

## Owner email
`vidhisalesproducts@gmail.com`

## Automatic email setup
The site is prepared for EmailJS. In `index.html`, replace:
- `YOUR_EMAILJS_PUBLIC_KEY`
- `YOUR_EMAILJS_SERVICE_ID`
- `YOUR_EMAILJS_QUOTE_TEMPLATE_ID`
- `YOUR_EMAILJS_CONTACT_TEMPLATE_ID`

Set the EmailJS templates to send to `vidhisalesproducts@gmail.com`. The website will then send quotation/contact requests directly through EmailJS. Until configured, it opens the visitor's email app with the message pre-filled.

## GitHub
Create a repository, then from this folder run:
```bash
git init
git add .
git commit -m "VIDHI SALES professional website"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Important
Do not put Firebase Admin SDK credentials or private service-account keys in this frontend project.

# Final VS Code / GitHub Ready

## Latest visual update
- Added the official VIDHI SALES logo as `assets/vidhi-sales-logo.png`.
- Replaced repeated product images with individual product-reference crops from the supplied catalogue pages.
- Added the real Ponda shop-front image to the About section as `assets/shop-ponda.jpg`.
- Removed the duplicate shop image from the Shop section so the same shop photo is not repeated.
- Updated hero and service images to use separate references rather than repeating the same image.
