const autenticacao = () => {
	//quando a página acabar de carregar o sistema checa se o usuario esta autenticado ou não
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  //var usuario = null

  if(usuario != null){
    console.log("usuario autenticado")
    setTimeout(function(){
      window.location = "adm.html"
    }, 250)
  } else {
    console.log("usuario precisa de autenticação")
    esconderLoad()
  }
}

const enterPressed = (e) => {
	var code = (e.keyCode ? e.keyCode : e.which)
	if(code == 13) {
		autenticar()
	}
}

const autenticar = () => {

  var usuario = document.getElementById("usuario").value
  var senha = document.getElementById("senha").value

  if (usuario.length <= 3 || senha.length <= 4) {
    error("Usuario/Senha muito curto(s) ou inválido(s)")
  } else {
    mostrarLoad()
    axios.get('https://us-central1-ioi-printers.cloudfunctions.net/autenticar?usuario=' + usuario + '&senha=' + senha).then(res => {
      if(res.data.autenticado) {
        var usuario = {
          nome: res.data.nome,
          usuario: res.data.usuario,
          senha: res.data.senha,
          empresa: res.data.empresa
        }
        localStorage.setItem('usuario', JSON.stringify(usuario))
        window.location = "adm.html"
      } else {
        esconderLoad()
        setTimeout(function(){
          error("Usuário/Senha incorreto(s)")
        }, 250)
      }
    }).catch(err => {
      console.error(err)
      esconderLoad()
      setTimeout(function(){
        error("Tente novamente mais tarde")
      }, 250)
    })
  }
}

const mostrarLoad = () => {
  document.getElementById("load").style.display = "flex"

  setTimeout(function(){
    document.getElementById("load").style.opacity = "1"
    document.getElementById("login").style.opacity = "0"

    setTimeout(function(){
      document.getElementById("login").style.display = "none"
    }, 250)
  }, 50)
}

const esconderLoad = () => {
  document.getElementById("login").style.display = "flex"
  document.getElementById("login").style.opacity = "1"
  document.getElementById("load").style.opacity = "0"

  setTimeout(function(){
    document.getElementById("load").style.display = "none"
  }, 250)
}

const error = (message) => {
  document.getElementById("error").style.bottom = "0px"
  document.getElementById("error").innerHTML = message

  setTimeout(function(){
    document.getElementById("error").style.bottom = "-100px"
  }, 3000)
}
