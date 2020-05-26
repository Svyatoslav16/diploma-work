// document.getElementsByClassName('add-product-form')[0].addEventListener('submit', event => {
//     event.preventDefault();
//     let productName = document.getElementsByName('productName')[0].value;
//     let file = document.getElementsByName('filedata')[0].value.replace(/.*[\/\\]/, '');
//     let productCount = document.getElementsByName('productCount')[0].value;
//     let productAmount = document.getElementsByName('productAmount')[0].value;
//     let productCategoryId;
//     let productCategoryIdList = document.getElementsByName('productCategoryId');
//     let productDescription = document.getElementsByName('productDescription')[0].value;

//     for (let i = 0; i < productCategoryIdList.length; i++) {
//         if(productCategoryIdList[i].checked === true) {
//             productCategoryId = productCategoryIdList[i].value;
//         }
//     }

//     fetch('/addProduct', {
//         method: 'POST',
//         body: JSON.stringify({
//             productName, 
//             file, 
//             productCount,
//             productAmount,
//             productCategoryId,
//             productDescription
//         }),
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         }
//     }).then(res => {
//         if(!res.err) {
//             window.location.href = window.location.origin;
//         }
//     });
// });