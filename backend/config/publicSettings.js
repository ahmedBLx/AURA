/**
 * List of database setting keys that are allowed to be publicly exposed to guests.
 * Preventing future accidental exposure of sensitive keys (such as Cloudinary api_secret, JWT passwords, etc.).
 */
module.exports = [
  'store_name',
  'currency',
  'free_shipping_min',
  'women_soon',
  'landing_hero_image',
  'shipping_rates'
];
