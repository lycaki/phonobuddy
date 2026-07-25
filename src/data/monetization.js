export const MONETIZATION = {
  productName: 'PhonoBuddy Reception Phonics Starter Pack',
  suggestedPrice: '$5',
  productUrl: '',
  samplePdfPath: 'printables/phonobuddy-sample-pack.pdf',
  sampleHtmlPath: 'printables/phonobuddy-sample-pack.html',
  disclosure: 'If this page uses paid links later, I may earn a commission from purchases. I only link resources that fit PhonoBuddy practice.',
};

export function hasPaidProductLink() {
  return MONETIZATION.productUrl.trim().length > 0;
}
