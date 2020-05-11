const autenticacao = () => {
	//quando a página acabar de carregar o sistema checa se o usuario esta autenticado ou não
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  //var usuario = null

  if(usuario != null){
    console.log("usuario autenticado")
    receberDados(usuario)
  } else {
    error("Você não deveria estar aqui. Redirecionando para a autenticação!")
    setTimeout(function(){
      window.location = "auth.html"
    }, 3000)
  }
}

const receberDados = (usuario) => {
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/dados', {
    params: {
      plataforma: 'web',
      usuario: usuario.usuario,
      senha: usuario.senha
    }
  }).then(res => {
      processarDados(res.data)
  }).catch(err => {
    console.log(err)
    /*
    if(err.response.status === 401) {
      esconderLoad()
      setTimeout(function(){
        error("Usuário sem permissão ou não autenticado")
      }, 250)
    } else {
      esconderLoad()
      setTimeout(function(){
        error("Tivemos algum problema ao processar os dados. Tente novamente mais tarde.")
      }, 250)
    }
    */
  })
}

const processarDados = (dados) => {
  console.log(dados)
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
  /*
  document.getElementById("login").style.display = "flex"
  document.getElementById("login").style.opacity = "1"
  document.getElementById("load").style.opacity = "0"

  setTimeout(function(){
    document.getElementById("load").style.display = "none"
  }, 250)
  */
}

const error = (message) => {
  document.getElementById("error").style.bottom = "0px"
  document.getElementById("error").innerHTML = message

  setTimeout(function(){
    document.getElementById("error").style.bottom = "-100px"
  }, 3000)
}
