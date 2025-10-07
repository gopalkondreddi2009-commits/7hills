# 7hills — Static Demo

Professional editing services marketplace demo (static, no backend). Includes homepage, services catalog, cart (localStorage), and checkout form.

## Run locally

Open `index.html` directly in your browser, or serve the folder with any static server.

Examples:

```bash
# Python 3
python -m http.server 8000
# Then open http://localhost:8000
```

## Customize

- Edit services/pricing in `assets/js/app.js` (the `services` array)
- Update styles in `assets/css/styles.css`
- Modify copy and sections in `index.html` and `pages/checkout.html`

## Notes

- Cart and checkout are for demonstration only; connect a real payment provider for production (Stripe/PayPal).
- Taxes are simulated at 18% GST in the demo; adjust as needed.


