# PhonoBuddy monetization workflow

This is the lowest-friction earning path for the existing PhonoBuddy project: sell a small printable phonics pack and link it from the live app.

## First account to use

Start with Payhip.

- Free plan has no monthly fee.
- It supports digital downloads.
- It pays immediately after transactions through the connected payment account.
- It can use pay-what-you-want pricing such as `5+`.

Gumroad is also simple, but the direct-link fee is higher. TPT has better education marketplace demand, but it has seller membership fees and takes longer to set up well.

## Files generated

Run:

```bash
npm run generate:monetization
```

Generated files:

- `monetization/products/phonobuddy-reception-phonics-starter-pack.pdf`
- `monetization/products/phonobuddy-reception-phonics-starter-pack.html`
- `public/printables/phonobuddy-sample-pack.pdf`
- `public/printables/phonobuddy-sample-pack.html`
- `monetization/listing-copy.md`

## Launch steps

1. Create a Payhip account and connect PayPal or Stripe.
2. Add a digital product.
3. Upload `monetization/products/phonobuddy-reception-phonics-starter-pack.pdf`.
4. Use the title, description, tags, and price from `monetization/listing-copy.md`.
5. Publish the product.
6. Copy the product URL into `src/data/monetization.js` as `productUrl`.
7. Build and deploy the app.

## Automation boundary

The repeatable work is automated: generating the product, sample, and listing copy from PhonoBuddy's existing data. Account creation, identity checks, bank details, tax forms, and final marketplace publishing must be done by the account owner.

Do not automate ad clicks, paid-to-click traffic, reviews, fake engagement, or marketplace manipulation.
