// The ingredient catalog: every ingredient a recipe can use, with the store
// aisle it's shelved in (the shopping list groups by aisle) and its English
// name, as [singular, plural] when the plural differs. Arabic names live in
// ingredients.ar.js. Recipes reference ingredients by key, so the same
// lemon in five recipes merges into one line on the shopping list.

export const AISLES = ['produce', 'meat', 'dairy', 'bakery', 'grains', 'canned', 'pantry', 'nuts', 'frozen', 'other'];

export const ingredients = {
  // Produce
  lemon: { aisle: 'produce', en: ['lemon', 'lemons'] },
  lime: { aisle: 'produce', en: ['lime', 'limes'] },
  cucumber: { aisle: 'produce', en: ['cucumber', 'cucumbers'] },
  tomato: { aisle: 'produce', en: ['tomato', 'tomatoes'] },
  'cherry-tomatoes': { aisle: 'produce', en: 'cherry tomatoes' },
  garlic: { aisle: 'produce', en: 'garlic' },
  onion: { aisle: 'produce', en: ['onion', 'onions'] },
  'red-onion': { aisle: 'produce', en: ['red onion', 'red onions'] },
  'spring-onion': { aisle: 'produce', en: ['spring onion', 'spring onions'] },
  carrot: { aisle: 'produce', en: ['carrot', 'carrots'] },
  celery: { aisle: 'produce', en: ['celery stalk', 'celery stalks'] },
  zucchini: { aisle: 'produce', en: ['zucchini', 'zucchini'] },
  'red-bell-pepper': { aisle: 'produce', en: ['red bell pepper', 'red bell peppers'] },
  'yellow-bell-pepper': { aisle: 'produce', en: ['yellow bell pepper', 'yellow bell peppers'] },
  'green-pepper': { aisle: 'produce', en: ['green pepper', 'green peppers'] },
  jalapeno: { aisle: 'produce', en: ['jalapeño', 'jalapeños'] },
  avocado: { aisle: 'produce', en: ['avocado', 'avocados'] },
  broccoli: { aisle: 'produce', en: 'broccoli' },
  'green-beans': { aisle: 'produce', en: 'green beans' },
  potatoes: { aisle: 'produce', en: 'potatoes' },
  mushrooms: { aisle: 'produce', en: 'mushrooms' },
  'baby-spinach': { aisle: 'produce', en: 'baby spinach' },
  'romaine-lettuce': { aisle: 'produce', en: 'romaine lettuce' },
  'red-cabbage': { aisle: 'produce', en: 'red cabbage' },
  'fresh-ginger': { aisle: 'produce', en: 'fresh ginger' },
  'fresh-parsley': { aisle: 'produce', en: 'fresh parsley' },
  'fresh-basil': { aisle: 'produce', en: 'fresh basil' },
  'fresh-cilantro': { aisle: 'produce', en: 'fresh cilantro' },
  'fresh-dill': { aisle: 'produce', en: 'fresh dill' },
  'fresh-mint': { aisle: 'produce', en: 'fresh mint' },
  'mixed-berries': { aisle: 'produce', en: 'mixed berries' },

  // Meat & fish
  'chicken-breast': { aisle: 'meat', en: 'chicken breast' },
  'chicken-thighs': { aisle: 'meat', en: 'boneless chicken thighs' },
  'salmon-fillet': { aisle: 'meat', en: 'salmon fillet' },
  'sushi-salmon': { aisle: 'meat', en: 'sushi-grade salmon' },
  'ground-turkey': { aisle: 'meat', en: 'ground turkey' },
  'beef-sirloin': { aisle: 'meat', en: 'beef sirloin' },
  shrimp: { aisle: 'meat', en: 'raw peeled shrimp' },
  bacon: { aisle: 'meat', en: 'bacon (or turkey bacon)' },

  // Dairy, eggs & tofu
  eggs: { aisle: 'dairy', en: ['egg', 'eggs'] },
  'greek-yogurt': { aisle: 'dairy', en: 'Greek yogurt' },
  feta: { aisle: 'dairy', en: 'feta' },
  mozzarella: { aisle: 'dairy', en: 'fresh mozzarella' },
  parmesan: { aisle: 'dairy', en: 'parmesan' },
  'blue-cheese': { aisle: 'dairy', en: 'blue cheese' },
  cheddar: { aisle: 'dairy', en: 'cheddar' },
  butter: { aisle: 'dairy', en: 'butter' },
  milk: { aisle: 'dairy', en: 'milk' },
  'almond-milk': { aisle: 'dairy', en: 'unsweetened almond milk' },
  tofu: { aisle: 'dairy', en: 'firm tofu' },

  // Bakery
  'sourdough-bread': { aisle: 'bakery', en: 'sourdough bread' },
  'pita-bread': { aisle: 'bakery', en: ['whole-wheat pita', 'whole-wheat pitas'] },
  'flour-tortillas': { aisle: 'bakery', en: ['small flour tortilla', 'small flour tortillas'] },
  'corn-tortillas': { aisle: 'bakery', en: ['corn tortilla', 'corn tortillas'] },

  // Rice, grains & pasta
  quinoa: { aisle: 'grains', en: 'quinoa' },
  bulgur: { aisle: 'grains', en: 'fine bulgur' },
  spaghetti: { aisle: 'grains', en: 'spaghetti' },
  'small-pasta': { aisle: 'grains', en: 'small pasta (ditalini)' },
  'arborio-rice': { aisle: 'grains', en: 'arborio rice' },
  'jasmine-rice': { aisle: 'grains', en: 'jasmine rice' },
  'sushi-rice': { aisle: 'grains', en: 'sushi rice' },
  'long-grain-rice': { aisle: 'grains', en: 'long-grain rice' },
  'cooked-rice': { aisle: 'grains', en: 'cooked rice, ideally a day old' },
  'rolled-oats': { aisle: 'grains', en: 'rolled oats' },
  'rice-vermicelli': { aisle: 'grains', en: 'rice vermicelli' },
  'rice-paper': { aisle: 'grains', en: ['rice paper sheet', 'rice paper sheets'] },
  'red-lentils': { aisle: 'grains', en: 'red lentils' },
  granola: { aisle: 'grains', en: 'granola' },
  breadcrumbs: { aisle: 'grains', en: 'breadcrumbs' },
  flour: { aisle: 'grains', en: 'plain flour' },

  // Cans & jars
  'canned-tomatoes': { aisle: 'canned', en: 'chopped tomatoes' },
  'tomato-paste': { aisle: 'canned', en: 'tomato paste' },
  'cannellini-beans': { aisle: 'canned', en: 'cannellini beans' },
  'black-beans': { aisle: 'canned', en: 'black beans' },
  'kidney-beans': { aisle: 'canned', en: 'kidney beans' },
  chickpeas: { aisle: 'canned', en: 'chickpeas' },
  'fava-beans': { aisle: 'canned', en: 'fava beans (ful medames)' },
  olives: { aisle: 'canned', en: 'kalamata olives' },
  pickles: { aisle: 'canned', en: 'pickled cucumbers' },
  'vegetable-stock': { aisle: 'canned', en: 'vegetable stock' },

  // Oils, sauces & spices
  'olive-oil': { aisle: 'pantry', en: 'olive oil' },
  'neutral-oil': { aisle: 'pantry', en: 'neutral oil' },
  'sesame-oil': { aisle: 'pantry', en: 'toasted sesame oil' },
  'soy-sauce': { aisle: 'pantry', en: 'soy sauce' },
  'rice-vinegar': { aisle: 'pantry', en: 'rice vinegar' },
  'red-wine-vinegar': { aisle: 'pantry', en: 'red wine vinegar' },
  tahini: { aisle: 'pantry', en: 'tahini' },
  'peanut-butter': { aisle: 'pantry', en: 'peanut butter' },
  honey: { aisle: 'pantry', en: 'honey' },
  'maple-syrup': { aisle: 'pantry', en: 'maple syrup' },
  'dijon-mustard': { aisle: 'pantry', en: 'Dijon mustard' },
  cornstarch: { aisle: 'pantry', en: 'cornstarch' },
  salt: { aisle: 'pantry', en: 'sea salt' },
  'black-pepper': { aisle: 'pantry', en: 'black pepper' },
  'white-pepper': { aisle: 'pantry', en: 'white pepper' },
  oregano: { aisle: 'pantry', en: 'dried oregano' },
  cumin: { aisle: 'pantry', en: 'ground cumin' },
  coriander: { aisle: 'pantry', en: 'ground coriander' },
  paprika: { aisle: 'pantry', en: 'paprika' },
  'smoked-paprika': { aisle: 'pantry', en: 'smoked paprika' },
  'chili-powder': { aisle: 'pantry', en: 'chili powder' },
  'chili-flakes': { aisle: 'pantry', en: 'chili flakes' },
  'garlic-powder': { aisle: 'pantry', en: 'garlic powder' },
  turmeric: { aisle: 'pantry', en: 'ground turmeric' },
  cinnamon: { aisle: 'pantry', en: 'ground cinnamon' },

  // Nuts & seeds
  walnuts: { aisle: 'nuts', en: 'walnuts' },
  almonds: { aisle: 'nuts', en: 'sliced almonds' },
  'pumpkin-seeds': { aisle: 'nuts', en: 'pumpkin seeds' },
  'sesame-seeds': { aisle: 'nuts', en: 'sesame seeds' },
  'chia-seeds': { aisle: 'nuts', en: 'chia seeds' },

  // Frozen
  edamame: { aisle: 'frozen', en: 'shelled edamame' },
  peas: { aisle: 'frozen', en: 'frozen peas' },
};

