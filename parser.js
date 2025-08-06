/**
 * Получить значение свойства content в мета-теге
 * @param {string} name Значение свойства name в мета-теге
 * @returns {string} Значение свойства content
 */
function parseMetaContent(name) {
    const metaElement = document.querySelector(`meta[name=${name}]`);
    return metaElement.getAttribute('content');
}

/**
 * Получить объект спарсенных значений свойств мета-тега opengraph
 * @returns {object} Объект из спарсенных пар значений свойства property и content
 */
function parseOpengraph() {
    // Парсим все мета-теги, начинающиеся с "og:"
    const ogElements = document.querySelectorAll('meta[property^=\"og:\"]');
    const og = {};
    
    ogElements.forEach(element => {
        const key = element.getAttribute('property')
                           .slice(3);
        const value = element.getAttribute('content');

        // Если парсим og:title, то парсим только название сайта
        og[key] = key === 'title' ? value.split('—')[0].trim() : value;
    });

    return og;
}

/**
 * Получить все теги из карточки товара
 * @returns {object} Объект из спарсенных пар значений тип тега и наименование тега
 */
function parseProductTags() {
    const tagElements = document.querySelectorAll('.product .tags span');
    const tags = {};

    tagElements.forEach(tag => {
        let key = '';
        const value = tag.textContent.trim();

        switch (tag.className) {
            case 'green':
                key = 'category'
                break;
            case 'blue':
                key = 'label';
                break;
            case 'red':
                key = 'discount';
                break;
            // Если иной класс тега
            default:
                key = 'notFound';
                break;
        }

        tags[key] = [value];
    });

    return tags;
}

/**
 * Получить информацию обо всех изображениях в карточке товара
 * @returns {object} Массив из объектов, содержащих информации об изображениях в карточке товара
 */
function parseProductImages() {
    const imageElements = document.querySelectorAll('.product .preview nav img');
    const images = new Set();

    imageElements.forEach(image => {
        images.add(
            {
                "preview": image.getAttribute('src'),
                "full": image.dataset.src,
                "alt": image.getAttribute('alt')
            }
        );
    });

    return Array.from(images);
}

/**
 * Получить цену из карточки товара
 * @param {string} type current - текущая цена. old - старая цена
 * @returns {number} Цена из карточке товара
 */
function parseProductPrice(type='current') {
    const fullPriceElement = document.querySelector('.product .about .price');
    // fullPriceElement.innerText = {валюта}{новая_цена}\n <span>{валюта}{старая_цена}</span>
    return +fullPriceElement.innerText
                     .trim()
                     .split(' ')[type === 'current' ? 0 : 1]
                     .slice(1);
}

function parseProductDiscount(type='value') {
    const discountValue = +(parseProductPrice('old') - parseProductPrice()).toFixed(2);

    if (type === 'value') {
        return discountValue;
    } else {
        const discountPercent = discountValue === 0 ? 0 : (discountValue / (parseProductPrice('old') / 100)).toFixed(2);

        return `${discountPercent}%`
    }
}


/**
 * Конвертировать символ валюты в кодовое название валюты из 3 литер на латинице
 * @param {string} currency Символ валюты
 * @returns {string} Кодовое название валюты из 3 литер на латинице
 */
function parseCurrency(currency) {
    switch (currency) {
        case '₽':
            return 'RUB'
        case '$':
            return 'USD'
        case '€':
            return 'EUR'
        // Если иной символ валюты
        default:
            return 'notFound';
    }
}

/**
 * Получить объект из пар значений наименования свойства и значения свойства
 * @returns {object} Объект из пар значений наименования свойства и значения свойства
 */
function parseProductProperties() {
    const propertyElements = document.querySelectorAll('.product .properties li')
    const properties = {};

    propertyElements.forEach(property => {
        const key = property.firstElementChild
                            .textContent
                            .trim();
        const value = property.lastElementChild
                              .textContent
                              .trim();

        properties[key] = value;
    });

    return properties;
}

/**
 * Получить полное описание из карточки товар
 * @returns {string} Описание из карточки товара
 */
function parseProductDescription() {
    const description = document.querySelector('.product .description')
                                .innerHTML
                                .trim();

    // Вырезаем свойства заголовка третьего уровня
    return description.slice(0, 3) + description.slice(18);
}

/**
 * Спарсить мета-информацию страницы
 * @returns {object} Объект из данных об мета-информации страницы
 */
function parseMeta() {
    return {
        language: document.querySelector('html')
                          .getAttribute('lang'),
        // Парсим только название сайта
        title: document.querySelector('head title')
                       .textContent
                       .split('—')[0]
                       .trim(),
        keywords: parseMetaContent('keywords').split(',')
                                              .map(word => word.trim()),
        description: parseMetaContent('description'),
        opengraph: parseOpengraph()
    }
}

/**
 * Спарсить данные карточки товара на странице
 * @returns {object} Объект из данных карточки товара
 */
function parseProduct() {
    return {
        id: document.querySelector('.product')
                    .dataset
                    .id,
        images: parseProductImages(),
        isLiked: document.querySelector('button.like')
                         .classList
                         .contains('active'),
        name: document.querySelector('.product .about .title')
                      .textContent
                      .trim(),
        tags: parseProductTags(),
        price: parseProductPrice(),
        oldPrice: parseProductPrice('old'),
        discount: parseProductDiscount(),
        discountPercent: parseProductDiscount('percent'),
        currency: parseCurrency(document.querySelector('.product .price')
                                        .innerText
                                        .trim()
                                        .slice(0, 1)),
        properties: parseProductProperties(),
        description: parseProductDescription()
    }
}

/**
 * Спарсить дополнительные товары на странице
 * @returns {object} Массив из дополнительных товаров
 */
function parseSuggested() {
    const suggestElements = document.querySelectorAll('.suggested article');
    const suggested = [];

    suggestElements.forEach(suggest => {
        const image = suggest.querySelector('img');
        const name = suggest.querySelector('h3');
        const fullPrice = suggest.querySelector('b');
        const description = suggest.querySelector('p');

        suggested.push(
            {
                image: image.getAttribute('src'),
                name: name.textContent
                          .trim(),
                price: fullPrice.textContent
                                .trim()
                                .slice(1),
                currency: parseCurrency(fullPrice.textContent
                                                 .trim()
                                                 .slice(0, 1)),
                description: description.textContent
                                        .trim()
            }
        );
    });

    return suggested;
}

/**
 * Спарсить обзоры на странице
 * @returns {object} Массив из обзоров
 */
function parseReviews() {
    const reviewElements = document.querySelectorAll('.reviews article');
    const reviews = [];

    reviewElements.forEach(review => {
        const rating = review.querySelector('.rating');
        const author = review.querySelector('.author');
        const title = review.querySelector('.title');

        reviews.push(
            {
                // Считаем кол-во звезд с классом filled
                rating: rating.querySelectorAll('.filled')
                              .length,
                author: {
                    avatar: author.querySelector('img')
                                  .getAttribute('src'),
                    name: author.querySelector('span')
                                .textContent
                                .trim()
                },
                title: title.textContent
                            .trim(),
                description: title.nextElementSibling
                                  .textContent
                                  .trim(),
                date: author.querySelector('i')
                            .textContent
                            .trim()
                            .split('/')
                            .join('.')
            }
        );
    });

    return reviews;
}

/**
 * Спарсить данные на странице
 * @returns {object} Объект из спарсенных данных о странице
 */
function parsePage() {
    return {
        meta: parseMeta(),
        product: parseProduct(),
        suggested: parseSuggested(),
        reviews: parseReviews()
    };
}

window.parsePage = parsePage;
