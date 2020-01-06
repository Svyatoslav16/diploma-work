// function getCartData() {
//     let cartData = JSON.parse(localStorage.getItem('cart'));
//     fetch('/cart', {
//         method: 'POST',
//         body: JSON.stringify({cartData : cartData}),
//         headers: {
//             'Accept' : 'application/json',
//             'Content-Type' : 'application/json'
//         }
//     }).then((response) => {
//         return response.text();
//     }).then((body) => {
//         console.log(body);
//     });
//     }

function action(e) {
    // if(e.className === 'button-minus') {
    //     // e.nextElementSibling.value--;
    //     changeCountProductInCart('minus', e);
        
    // } else if( === 'button-plus') {
        // e.previousElementSibling.value++;
        changeCountProductInCart(e.className.split("-")[1], e);
    // }
}

function changeCountProductInCart(action, this_) {
    fetch('/changeCountProductInCart', {
        method: 'POST',
        body: JSON.stringify({
            product_id: this_.dataset.product_id,
            action: action
        }),
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        }
    }).then((res) => {
        if(res.ok) {
            if (action === 'plus') {
                this_.previousElementSibling.value++;
            } else if(action === 'minus') {
                this_.nextElementSibling.value--;
            }
        }
    });
    // .then((body) => {
    //     console.log(body);
    // });
}