const environment = import.meta.env;

export const business = {
  name: environment.VITE_BUSINESS_NAME || 'Jiro Imports',
  brand: {
    primary: 'Jiro',
    secondary: 'Imports',
  },
  tagline: environment.VITE_BUSINESS_TAGLINE || 'Wholesale food, made simple',
  phoneDisplay: environment.VITE_BUSINESS_PHONE || '+1 (555) 123-4567',
  phoneDial: environment.VITE_BUSINESS_PHONE_DIAL || '+15551234567',
  hours: environment.VITE_BUSINESS_HOURS || 'Mon–Sat, 8am–6pm',
  deliveryArea: environment.VITE_DELIVERY_AREA || 'Serving your neighborhood',
  whatsappNumber: environment.VITE_WHATSAPP_NUMBER || '2348146241359',
  instagramUrl: environment.VITE_INSTAGRAM_URL || 'https://instagram.com',
  facebookUrl: environment.VITE_FACEBOOK_URL || 'https://facebook.com',
  currency: environment.VITE_CURRENCY || 'USD',
  locale: environment.VITE_LOCALE || 'en-US',
  deliveryLabel: 'Free',
};

export const categories = ['All items', 'Fresh produce', 'Pantry', 'Dairy & eggs', 'Drinks'];

const currencyFormatter = new Intl.NumberFormat(business.locale, {
  style: 'currency',
  currency: business.currency,
  maximumFractionDigits: 0,
});

export const formatPrice = (value) => currencyFormatter.format(value);
