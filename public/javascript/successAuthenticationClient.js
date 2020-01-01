if(readCookie('userName') !== null && 
   readCookie('userSurname') !== null && 
   !!readCookie('successAuthentication') === true) {
    let details = document.createElement("details");
        details.className = "details";
    let summary = document.createElement("summary");
        summary.innerText = readCookie('userName') + ' '+ 
                            readCookie('userSurname');
    let div = document.createElement("div");
        div.className = "dropdown-menu";
    let a = document.createElement("a");
        a.innerText = "Выйти",
        a.className = "sign-out",
        a.href = "signOut",
        a.onclick = deleteAllCookies();
    div.appendChild(a);
    details.appendChild(summary);
    details.appendChild(div);
    document.querySelector(".authorization").appendChild(details);
    document.querySelector(".signUp").remove();
    document.querySelector(".signIn").remove();
} else if(readCookie('userName') !== null && 
          readCookie('userSurname') !== null && 
          !!readCookie('successAuthentication') === false) {
    console.log('Не пришло ФИО пользователя или при авторизации возникла ошибка');
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