let productIDInCart = [];
let productListElem = document.getElementsByClassName('product-list')[0];
let productCategoriesElem = document.getElementsByClassName('product-categories')[0];
let loadingWindowElem = document.querySelector('.loading-window');

const userStatus = {};

fetch('/userStatus').then(res => {
    if(res.ok) 
        return res.json();
    else 
        alert('ошибка');
}).then(body => {
    if(body) {
        userStatus.successAuthentication = body.successAuthentication;
        userStatus.isWorker = body.isWorker;

        getProductsFromCategory();
    }
});

fetch('/getCategories', {
    method: 'POST'
}).then(res => {
    if(res.ok)
        return res.json();
    else 
        alert(res.err);
}).then(body => {
    if(body) {
        for (let i = 0; i < body.length; i++) {
            let li = document.createElement('li');
                li.className = 'product-categories__category';
                li.setAttribute("data-category", body[i].id);
                li.innerText = body[i].name;

            productCategoriesElem.append(li);

            if(i === body.length - 1) {
                addLinksToCategories();
            }
        }
    }
});

function getProductsFromCategory(category) {
    loadingWindowElem.classList.add('active');
    
    fetch('/getProductsFromCategory', {
        method: 'POST',
        body: (category) ? JSON.stringify({category: category}) : '',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(res => {
        if(res.ok)
            return res.json();
        else 
            alert(res.err);
    }).then(body => {
        if(body) {
            productListElem.innerHTML = ''; // Очищение списка товаров из прошлой активной категории

            document.querySelectorAll('.product-categories__category').forEach(el => {
                // Удаление класса active из прошлой активной категории
                if(el.classList.contains('active')) {
                    el.classList.remove('active');
                }

                // Добавление класса active нынешней категории
                if(el.dataset.category == body[0].category) {
                    el.classList.add('active');
                }
            });

            let productList = [];

            for (let i = 0; i < body.length; i++) {

                let product = document.createElement('div');
                    product.className = 'product';
                    
                let h3 = document.createElement('h3');
                    h3.className = 'product-name';
                let h3Link = document.createElement('a');

                    h3Link.className = 'product-name-link';
                    h3Link.href = `/product?productId=${body[i].product_id}`;
                    h3Link.innerText = body[i].product_name;

                let imgWrap = document.createElement('a');
                    imgWrap.className = 'product-img-wrap';
                    imgWrap.href = `/product?productId=${body[i].product_id}`;

                let img = document.createElement('img');
                    img.src = body[i].product_url_img;

                let productPrice = document.createElement('div');
                    productPrice.className = 'product-price';

                let productAmount = document.createElement('span');
                    productAmount.className = 'product_amount';
                    productAmount.innerText = body[i].product_amount;

                let rubleIcon = document.createElement('object');
                    rubleIcon.className = 'ruble-icon';
                    rubleIcon.type = 'image/svg+xml';
                    // rubleIcon.data = 'images/ruble.svg';
                    rubleIcon.data = 'images/ruble_v2.svg';
                    rubleIcon.innerText = 'руб.';

                let button = document.createElement('button');
                    button.className = 'add-to-cart';
                    button.setAttribute("data-product_id", body[i].product_id);

                if(!userStatus.isWorker) {
                    if(userStatus.successAuthentication) {
                        button.innerText = 'Добавить в корзину';
                    } else {
                        let a = document.createElement('a');
                            a.href = '/signIn';
                            a.innerText = 'Добавить в корзину';
                        button.append(a);
                    }
                }

                h3.append(h3Link);

                imgWrap.append(img);

                productPrice.append(productAmount);
                productPrice.append(rubleIcon);

                product.append(h3);
                product.append(imgWrap);
                product.append(productPrice);

                if(!userStatus.isWorker) {
                    product.append(button);
                }
                productList.push(product);
                if(i === body.length - 1) {
                    console.log(document.querySelectorAll('.add-to-cart'));
                    

                    productInCart();
                }
            }

            
            for (let i = 0; i < productList.length; i++) {
                productListElem.append(productList[i]);
            }

            document.querySelectorAll('.add-to-cart').forEach(el => {
                el.onclick = addToCart;
            });
            
            // setTimeout(() => {
            loadingWindowElem.classList.remove('active');
            // }, 1000);
        }
    });
}

/**   fetch('/addToCart') */
function addToCart() {
    fetch('/addToCart', {
        method: 'POST',
        body: JSON.stringify({product_id: this.dataset.product_id}),
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        }
    }).then((res) => {
        if(res.status == '200') {
            this.innerText = 'Товар добавлен';
        } else if(res.status == '204') {
            this.innerText = 'Уже в корзине';
        }
    });
}

/** fetch('/getProductInCart') */
function productInCart() {
    fetch('/getProductInCart').then(res => {
        if(res.ok) {
            return res.json();
        }
    }).then(body => {
        if(body.length > 0) {
            // У кнопки с классом add-to-cart есть пользовательский атрибут data-product_id с ID товара
            document.querySelectorAll('.add-to-cart').forEach(el => {
                for (let i = 0; i < body.length; i++) {
                    if(el.dataset.product_id == body[i].id) {
                        el.innerText = 'В корзине';
                    }
                }
            });
            
            productIDInCart = body;
        }
    });
}

function addLinksToCategories() {
    document.querySelectorAll('.product-categories__category').forEach(el => {
        el.addEventListener('click', () => {
            getProductsFromCategory(el.dataset.category);
            el.parentNode.parentNode.classList.remove('active');
        });
    });
}