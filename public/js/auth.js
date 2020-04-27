const axios = require('axios')

window.onload = function() {
	//quando a página acabar de carregar o sistema checa se o usuario esta autenticado ou não
  var usuario = JSON.parse(localStorage.getItem('usuario'))

  if(usuario != null){
    console.log("usuario autenticado")
    //window.location = "adm.html"
  } else {
    console.log("usuario precisa de autenticação")
    setTimeout(function(){
      document.getElementById("loadTelaCheia").style.opacity = "0"
      document.getElementById("formLogin").style.display = "block"
      document.getElementById("formLogin").style.opacity = "1"

      setTimeout(function(){
        document.getElementById("loadTelaCheia").style.display = "none"
      }, 250)
    }, 500)
  }
}

function enterPressed(e){
	var code = (e.keyCode ? e.keyCode : e.which)
	if(code == 13) {
		autenticar()
	}
}

function autenticar() {

  var usuario = document.getElementById("usuario")
  var senha = document.getElementById("senha")
  var button = document.getElementById("loginButton")

  if (usuario.length <= 3 || senha.length <= 4) {
    alert("Usuario/Senha muito curto(s) ou inválido(s)")
  } else {

    document.getElementById("formLogin").style.opacity = "0"
    document.getElementById("loadTelaCheia").style.display = "flex"
    document.getElementById("loadTelaCheia").style.opacity = "1"

    setTimeout(function(){
      document.getElementById("formLogin").style.display = "none"
    }, 250)

    axios.request('').then((res) => {
      console.log(res.data)
      if(res.data.autenticado) {
        var usuario = {
          nome: res.data.nome,
          usuario: res.data.usuario,
          senha: res.data.senha,
          empresa: res.data.empresa
        }
        localStorage.setItem('usuario', JSON.stringify(usuario))
      } else {
        document.getElementById("loadTelaCheia").style.opacity = "0"
        document.getElementById("formLogin").style.display = "block"
        document.getElementById("formLogin").style.opacity = "1"

        setTimeout(function(){
          document.getElementById("loadTelaCheia").style.display = "none"
          alert("Usuário/Senha incorreto(s)")
        }, 250)
      }
    }).catch(err => {
      console.error(err)
      document.getElementById("loadTelaCheia").style.opacity = "0"
      document.getElementById("formLogin").style.display = "block"
      document.getElementById("formLogin").style.opacity = "1"

      setTimeout(function(){
        document.getElementById("loadTelaCheia").style.display = "none"
        alert("Tente novamente mais tarde")
      }, 250)
    })
  }
}
