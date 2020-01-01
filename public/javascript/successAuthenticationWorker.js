if(readCookie('workerName') !== null && 
   readCookie('workerSurname') !== null && 
   !!readCookie('successAuthentication') === true) {
    let details = document.createElement("details");
        details.className = "details";
    let summary = document.createElement("summary");
        summary.innerText = readCookie('workerName') + ' '+ 
                            readCookie('workerSurname');
    let div = document.createElement("div");
        div.className = "dropdown-menu";
    let signOut = document.createElement("a");
        signOut.innerText = "Выйти",
        signOut.className = "sign-out",
        signOut.href = "signOut",
        signOut.onclick = deleteAllCookies();
    let Products = document.createElement("a");
        Products.innerText = "Cписок товаров",
        Products.href = "Products";
    div.appendChild(signOut);
    // div.appendChild(editingProducts);
    details.appendChild(summary);
    details.appendChild(div);
    document.querySelector(".authorization").appendChild(Products);
    document.querySelector(".authorization").appendChild(details);
    document.querySelector(".signUp").remove();
    document.querySelector(".signIn").remove();
} else if(readCookie('workerName') !== null && 
          readCookie('workerSurname') !== null && 
          !!readCookie('successAuthentication') === false) {
    console.log('Не пришло ФИО сотрудника или при авторизации возникла ошибка');
}

function readCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
    }
    return null;
}