//clientes, leituras, dashboard, atendimentos, suprimentos, empresa
var tela = 'leituras'
var feedbacks = 0

//var dashboard
var usuarios
var tecnicos
//var empresa
//var estoque
var clientes
var atendimentos
var versao

const autenticacao = () => {
  mostrarLoad(document.body)
  //quando a página acabar de carregar o sistema checa se o usuario esta autenticado ou não
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  //var usuario = null

  if(usuario != null){
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
      //dashboard = res.data.dashboard
      usuarios = res.data.usuarios
      //empresa = res.data.empresa
      //estoque = res.data.estoque
      clientes = res.data.clientes
      atendimentos = res.data.atendimentos
      versao = res.data.versao

      document.getElementById('menu').style.opacity = "1"
      listagem(true)
  }).catch(err => {
    esconderLoad()
    setTimeout(function(){
      console.error(err)
      error("Tivemos algum problema ao processar os dados. Tente novamente mais tarde!")
    }, 250)
  })
}

const listagem = (criarFiltros) => {
  mostrarLoad(document.body)
  setTimeout(() => {
    switch (tela) {
      case "leituras":
        if(criarFiltros) { filtrosLeituras() }
        listagemLeituras()
        break
      case "clientes":
        listagemClientes()
        break
      case "atendimentos":
        //if(criarFiltros) { filtrosAtendimentos() }
        listagemAtendimentos()
        break
    }
    esconderLoad()
  }, 300)
}

const mostrarLoad = (el) => {
  var load = document.getElementById("tLoad").content.cloneNode(true)
  el.appendChild(load)
  el.querySelector("#load").style.display = "flex"

  setTimeout(function(){
    el.querySelector("#load").style.opacity = "1"
  }, 50)
}

const esconderLoad = () => {
  var load = document.body.querySelector("#load")
  load.style.opacity = "0"

  setTimeout(function(){
    load.remove()
  }, 250)
}

const error = (message) => {
  document.getElementById("error").style.bottom = "0px"
  document.getElementById("error").innerHTML = message

  setTimeout(function(){
    document.getElementById("error").style.bottom = "-100px"
  }, 7000)
}

const feedback = (a) => {
  var processando = "Processando " + feedbacks + " trabalhos, por favor aguarde!"
  var concluido = "Todos os trabalhos foram concluídos"
  document.getElementById("feedback").style.bottom = "0px"
  if(a) {
    document.getElementById("feedback").innerHTML = processando
  } else {
    document.getElementById("feedback").innerHTML = concluido
  }

  setTimeout(function(){
    document.getElementById("feedback").style.bottom = "-100px"
  }, 3000)
}

/*
*
* funções sobre a listagem de leituras
*
*/
/*
* cria os filtros de leitura
*/
const filtrosLeituras = () => {
  var filtros = document.getElementById("tFiltrosLeitura").content.cloneNode(true)
  document.getElementById("listagem").appendChild(filtros)
  gerarDatasDeListagem()
}

const gerarDatasDeListagem = () => {
  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if(mes < 10) { mes = "0" + mes }

  var datas = document.getElementById("datasDeLeituras")
  datas.innerHTML = ""
	//preenche os meses disponiveis
	for(var x = 0; x < 4; x++){

    var data = document.createElement("option")
    data.value = ano + "-" + mes
    data.innerHTML = mes + "/" + ano
    datas.appendChild(data)

		if(mes <= 1){
			mes = 12
			ano = ano - 1
		} else {
			mes = mes - 1
      if (mes < 10) { mes = "0" + mes }
		}
	}
}

/*
* separa as leituras de acordo com os filtros e cria a interface por fim
*/
const listagemLeituras = () => {

  var filtros = document.getElementById("filtrosDeLeituras")
  var filtroSelecionado = filtros.options[filtros.selectedIndex].value
  var interfaces = new DocumentFragment()

  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]

    if(cliente.ativo && cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0) {
      cliente = preparLeiturasParaListagem(cliente)

      if(filtroSelecionado == "todas") {
        interfaces.appendChild(criarInterfaceLeitura(cliente, true))
      } else if(filtroSelecionado == "alertas" && (cliente.sistema.versao != versao || cliente.impressoras.atraso)){
        interfaces.appendChild(criarInterfaceLeitura(cliente, true))
      } else if(filtroSelecionado == "excedentes" && cliente.excedentes > 0){
        interfaces.appendChild(criarInterfaceLeitura(cliente, true))
      } else if(filtroSelecionado == "excluidas"  && cliente.impressoras.inativas) {
        interfaces.appendChild(criarInterfaceLeitura(cliente, false))
      }
    }
  }
  document.getElementById("listagem").appendChild(interfaces)
}

const preparLeiturasParaListagem = (cliente) => {

  var datas = document.getElementById("datasDeLeituras")
  var listagem = datas.options[datas.selectedIndex].value

  if(cliente.franquia.valor == undefined || cliente.franquia.valor == null 
    || cliente.franquia.tipo == "maquina" || cliente.franquia.tipo == "ilimitado") {
    cliente.franquia.valor = 0
  }

  cliente.impresso = 0
  cliente.excedentes = 0
  cliente.impressoras.atraso = false
  cliente.impressoras.inativas = false
  var impressoras = cliente.impressoras

  if(impressoras != undefined && impressoras != null) {
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]
      if(impressora.leituras != undefined) {
        impressora.serial = Object.keys(impressoras)[x]
        impressora.impresso = 0
        impressora.excedentes = 0
        /*
        * define a franquia total do cliente se a franquia for separada por maquinas
        */
        if(cliente.franquia.tipo !== "ilimitado" && cliente.franquia.tipo !== "pagina") {
          cliente.franquia.valor = parseInt(cliente.franquia.valor) + parseInt(impressora.franquia)
        }
        /*
        * define o total impresso por todas as maquinas
        */
        if(impressora.leituras[listagem] !== undefined) {
          var inicio = impressora.leituras[listagem].inicial.valor
          var fim = impressora.leituras[listagem].final.valor
          cliente.impresso = cliente.impresso + (fim - inicio)
          impressora.impresso = fim - inicio
          impressora.excedentes = 0
          if(impressora.impresso > impressora.franquia && cliente.franquia.tipo == "maquina") {
            impressora.excedentes = impressora.impresso - impressora.franquia
            cliente.excedentes = cliente.excedentes + impressora.excedentes
          }

          //checa se o ultimo dia de leitura foi a mais de 5 dias atrás
          var a = new Date()
          //precisa adicionar + 1 no dia pois senão se o valor for 10 pegará o dia 9
          var b = new Date(listagem + "-" + (parseInt(impressora.leituras[listagem].final.dia) + 1))

          if(Math.ceil(Math.abs(a - b) / (1000 * 3600 * 24)) > 5 && impressora.ativa){
            cliente.impressoras.atraso = true
          }
        } else if(impressora.ativa) {
          cliente.impressoras.atraso = true
        }
        if(!impressora.ativa) {
          cliente.impressoras.inativas = true
        }
      }
    }
  }

  if(cliente.franquia.tipo == "pagina") {
    if(cliente.franquia.valor < cliente.impresso) {
    cliente.excedentes = cliente.impresso - cliente.franquia.valor
    }
  }
  return cliente
}

const criarInterfaceLeitura = (cliente, ativas) => {
  var leitura = document.getElementById("tLeitura").content.cloneNode(true)
  
  leitura.querySelector(".leituraTitulo").querySelector("i").onclick = ((cliente) => {
    return function(){expandirLeitura(cliente)}
  })(cliente)

  //id principal
  leitura.querySelector("leitura").id = cliente.id
  if(cliente.sistema.versao == "Não instalado" || cliente.sistema.versao != versao){
    leitura.querySelector(".leituraTitulo").style.backgroundColor = "var(--atraso)";
  } else if(cliente.impressoras.atraso) {
    leitura.querySelector(".leituraTitulo").style.backgroundColor = "var(--alerta)"
  }
  //define o nome do cliente na leitura
  leitura.querySelector("#nome").innerHTML = cliente.nomefantasia
  //define a versão do coletor
  leitura.querySelector("#versao").innerHTML = cliente.sistema.versao
  //define o numero de impressoras (precisa subtrair 2 do length pois tem duas variáveis definidas junto)
  leitura.querySelector("#impressoras").innerHTML = pegarQuantidadeImpressoras(ativas, cliente.impressoras)
  
  if(ativas) {
    //define o numero de excedentes
    leitura.querySelector("#excedentes").innerHTML = cliente.excedentes + " págs"
  } else {
    leitura.querySelector("#excedentes").innerHTML = "Excluídas"
  }
  
  //define a franquia
  if(cliente.franquia.tipo == "ilimitado") {
    leitura.querySelector("#franquia").innerHTML = "S/F"
  } else {
    leitura.querySelector("#franquia").innerHTML = cliente.franquia.valor + " págs"
  }
  if(ativas) {
    //define o total impresso
    leitura.querySelector("#impresso").innerHTML = cliente.impresso + " págs"
  } else {
    leitura.querySelector("#impresso").innerHTML = "Excluídas"
  }
  return leitura
}

const pegarQuantidadeImpressoras = (ativas, impressoras) => {
  var count = 0

  for(var x = 0; x < Object.keys(impressoras).length; x++) {
    var impressora = impressoras[Object.keys(impressoras)[x]]

    if(impressora.modelo != undefined && impressora.ativa == ativas) {
      count ++
    }
  }
  return count
}

/*
* expande e fecha as leituras
*/
const expandirLeitura = (cliente) => {

  var listagens = document.getElementById("listagem").querySelector("#filtrosDeLeituras")
  var listagem = listagens.options[listagens.selectedIndex].value
  var datas = document.getElementById("listagem").querySelector("#datasDeLeituras")
  var data = datas.options[datas.selectedIndex].value

  var expandida = document.getElementById("tLeituraExpandida").content.cloneNode(true)
  expandida.querySelector("#editCliente").onclick = () => {expandirCliente(cliente)}
  expandida.querySelector("#salvar").onclick = () => {salvarLeituras(cliente)}
  expandida.querySelector("#relatorio").onclick = () => {gerarRelatorio(cliente)}
  //define o nome na leitura expandida
  expandida.querySelector("#nome").innerHTML = cliente.nomefantasia
  //permite que se altere as datas dentro do cliente expandido
  expandida.querySelector("#datasDeLeiturasExpandida").onchange = () => {alterarListagemLeituraExpandida(cliente)}
  //define o total impresso
  expandida.querySelector("#impresso").innerHTML = cliente.impresso + ' págs'
  //define o valor dos excedentes
  expandida.querySelector("#excedentes").innerHTML = cliente.excedentes + ' págs'
  //define dados do rodapé
  expandida.querySelector("#chave").innerHTML = 'Chave do cliente: ' + cliente.id
  expandida.querySelector("#local").innerHTML = 'Local inst. do coletor: ' + atob(cliente.sistema.local)
  expandida.querySelector("#versao").innerHTML = 'Versão do coletor: ' + cliente.sistema.versao

  var interfaces = new DocumentFragment()
  var impressoras = cliente.impressoras
  for(var x = 0; x < Object.keys(impressoras).length; x++) {
    var impressora = impressoras[Object.keys(impressoras)[x]]
    if(impressora.modelo != undefined) {
      if(listagem == "excluidas" && !impressora.ativa) {
        interfaces.appendChild(criarInterfaceImpressora(impressora, true, data))
      } else if(impressora.ativa && listagem != "excluidas") {
        interfaces.appendChild(criarInterfaceImpressora(impressora, false, data))
      }
    }
  }
  expandida.querySelector("#impressoras").appendChild(interfaces)

  if(cliente.franquia.tipo == "pagina"){
    expandida.querySelector("#tipoFranquia").selectedIndex = "1"
  } else if(cliente.franquia.tipo == "maquina") {
    expandida.querySelector("#tipoFranquia").selectedIndex = "2"
  } else if(cliente.franquia.tipo == "ilimitado") {
    expandida.querySelector("#tipoFranquia").selectedIndex = "0"
  }
  alterarTipoFranquia(expandida.querySelector("#tipoFranquia"))

  expandida.querySelector("#franquiaValor").value = cliente.franquia.valor
  converterNumeroPagina(expandida.querySelector("#franquiaValor"))

  document.body.appendChild(expandida)
  gerarDatasExpandida()
  setTimeout(() => {
    document.getElementById("leituraExpandida").style.opacity = "1"
  }, 10)
}

const gerarDatasExpandida = () => {
  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if(mes < 10) { mes = "0" + mes }

  var datasMaster = document.getElementById("listagem").querySelector("#datasDeLeituras")
  var dataMaster = datasMaster.options[datasMaster.selectedIndex].value

  var datas = document.getElementById("datasDeLeiturasExpandida")
  datas.innerHTML = ""
	//preenche os meses disponiveis
	for(var x = 0; x < 4; x++){

    var data = document.createElement("option")
    data.value = ano + "-" + mes
    data.innerHTML = mes + "/" + ano
    datas.appendChild(data)
    if(data.value == dataMaster) {
      datas.selectedIndex = x
    }

		if(mes <= 1){
			mes = 12
			ano = ano - 1
		} else {
			mes = mes - 1
      if (mes < 10) { mes = "0" + mes }
		}
	}
}

const fecharLeitura = () => {
  var leituraExpandida = document.getElementById("leituraExpandida")
  leituraExpandida.style.opacity = "0"
  setTimeout(() => {
    leituraExpandida.remove()
  }, 200)
}

/*
* cria a interface da leitura expandida
*/
const criarInterfaceImpressora = (impressora, excluidas, listagem) => {

  var data = listagem.split('-')[1] + '/' + listagem.split('-')[0]

  var layout = document.getElementById("tImpressora").content.cloneNode(true)
  layout.querySelector("impressora").id = impressora.serial
  layout.querySelector("#modelo").innerHTML = impressora.modelo
  layout.querySelector("#deletar").onclick = (element) => {alterarStatusImpressora(element, impressora)}
  /*
  layout.querySelector("#deletar").onclick = ((element, impressora) => {
    return function(){alterarStatusImpressora(element, impressora)}
  })(impressora)
  */

  layout.querySelector("#setor").value = impressora.setor
  layout.querySelector("#serial").innerHTML = impressora.serial
  layout.querySelector("#serial").title = impressora.serial
  layout.querySelector("#ip").innerHTML = impressora.ip
  layout.querySelector("#ip").title = impressora.ip
  layout.querySelector("#impresso").innerHTML = impressora.impresso + " págs"
  layout.querySelector("#franquia").value = impressora.franquia + " págs"
  layout.querySelector("#excedentes").innerHTML = impressora.excedentes + " págs"

  if(impressora.leituras != undefined && impressora.leituras[listagem] != undefined) {
    layout.querySelector("#inicial").innerHTML = impressora.leituras[listagem].inicial.dia + '/' + data + ' - ' + impressora.leituras[listagem].inicial.valor + " págs"
    layout.querySelector("#final").innerHTML = impressora.leituras[listagem].final.dia + '/' + data + ' - ' + impressora.leituras[listagem].final.valor + " págs"
  } else {
    layout.querySelector("#inicial").innerHTML = "Sem Registro"
    layout.querySelector("#final").innerHTML = "Sem Registro"
  }

  if(excluidas) {
    layout.querySelector("#deletar").className = "fas fa-trash-restore"
    layout.querySelector("#deletar").title = "Restaurar impressora"
    layout.querySelector(".leituraTitulo").style.backgroundColor = "var(--erro)"
  }

  return layout
}

/*
* converte "000 págs" em "000" ou vice versa
*/
const converterNumeroPagina = (elemento) => {

  if(elemento.value != ""){
    var numbersOnly = /^\d+$/.test(elemento.value)
    if(numbersOnly){
      elemento.value = elemento.value + " págs"
    } else {
      elemento.value = ""
      alert("Franquia inválida")
    }
  }
}

var converterPaginaNumero = (elemento) => {
  elemento.value = elemento.value.replace(/ págs/g , "")
}

/*
* altera a listagem das leituras
*/
//limpa tudo, cria os filtros e lista as leituras do zero
const selecionarLeituras = () => {
  if(tela != "leituras") {
    tela = "leituras"
    document.getElementById("listagem").innerHTML = ""
    listagem(true)
  }
}

const alterarListagemLeitura = () => {
  document.querySelectorAll('leitura').forEach(el => {
    el.remove()
  })
  listagem(false)
}

const alterarListagemLeituraExpandida = (cliente) => {
  document.querySelectorAll('impressora').forEach(el => {
    el.remove()
  })
  mostrarLoad(document.getElementById("conteudo").querySelector("#impressoras"))
  var listagens = document.getElementById("datasDeLeiturasExpandida")
  var listagem = listagens.options[listagens.selectedIndex].value

  if(cliente.franquia.valor == undefined || cliente.franquia.valor == null) {
    cliente.franquia.valor = 0
  }

  cliente.impresso = 0
  cliente.impressoras.atraso = false
  cliente.impressoras.inativas = false
  var impressoras = cliente.impressoras

  if(impressoras != undefined && impressoras != null) {
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]
      if(impressora.leituras != undefined) {
        impressora.serial = Object.keys(impressoras)[x]
        impressora.impresso = 0
        impressora.excedentes = 0
        /*
        * define a franquia total do cliente se a franquia for separada por maquinas
        */
        if(cliente.franquia.tipo !== "ilimitado" && cliente.franquia.tipo !== "pagina") {
          cliente.franquia.valor = parseInt(cliente.franquia.valor) + parseInt(impressora.franquia)
        }
        /*
        * define o total impresso por todas as maquinas
        */
        if(impressora.leituras[listagem] !== undefined) {
          var inicio = impressora.leituras[listagem].inicial.valor
          var fim = impressora.leituras[listagem].final.valor
          cliente.impresso = cliente.impresso + (fim - inicio)
          impressora.impresso = fim - inicio
          if(impressora.impresso > impressora.franquia) {
            impressora.excedentes = impressora.impresso - impressora.franquia
          }

          //checa se o ultimo dia de leitura foi a mais de 5 dias atrás
          var a = new Date()
          //precisa adicionar + 1 no dia pois senão se o valor for 10 pegará o dia 9
          var b = new Date(listagem + "-" + (parseInt(impressora.leituras[listagem].final.dia) + 1))

          if(Math.ceil(Math.abs(a - b) / (1000 * 3600 * 24)) > 5 && impressora.ativa){
            cliente.impressoras.atraso = true
          }
        } else if(impressora.ativa) {
          cliente.impressoras.atraso = true
        }
        if(!impressora.ativa) {
          cliente.impressoras.inativas = true
        }
      }
    }
  }

  if(cliente.franquia.tipo !== "ilimitado") {
    if(cliente.franquia.valor < cliente.impresso) {
    cliente.excedentes = cliente.impresso - cliente.franquia.valor
    } else {
      cliente.excedentes = 0
    }
  }

  setTimeout(() => {
    var expandida = document.getElementById('leituraExpandida')
    //define o total impresso
    expandida.querySelector("#impresso").innerHTML = cliente.impresso + ' págs'
    //define o valor dos excedentes
    expandida.querySelector("#excedentes").innerHTML = cliente.excedentes + ' págs'

    var interfaces = new DocumentFragment()
    var impressoras = cliente.impressoras
    if(impressoras != undefined && impressoras != null) {
      for(var x = 0; x < Object.keys(impressoras).length; x++) {
        var impressora = impressoras[Object.keys(impressoras)[x]]
        if(impressora.ativa) {
          interfaces.appendChild(criarInterfaceImpressora(impressora, false, listagem))
        }
      }
      expandida.querySelector("#impressoras").appendChild(interfaces)
    }
    esconderLoad()
  }, 300)
}

/*
* altera a franquia do cliente quando a leitura está expandida
*/
const alterarTipoFranquia = (elemento) => {

  var tipo = elemento.value
  //vai pra section com id de conteudo
  var container = elemento.parentNode.parentNode.parentNode.parentNode
  var section = container.querySelector("#franquiaContainer")
  var impressoras = container.querySelectorAll("impressora")

  if(tipo == "pagina") {

    section.style.display = "block"
    setTimeout(() => {
      section.style.width = "100%"
      section.style.paddingRight = "12px"
      section.style.paddingLeft = "12px"
      section.style.opacity = "1"
    }, 10)

    impressoras.forEach((impressora) => {

      var dados = impressora.querySelector("#franquiaImpressora")
      dados.style.height = "0px"
      dados.style.opacity = "0"
      dados.style.marginTop = "0px"
      dados.style.marginBottom = "0px"
      setTimeout(() => {
        dados.style.display = "none"
      }, 250)
    })

  } else if (tipo == "maquina"){

    section.style.width = "0px"
    section.style.paddingRight = "0px"
    section.style.paddingLeft = "0px"
    section.style.opacity = "0"
    setTimeout(() => {
      section.style.display = "none"
    }, 250)

    impressoras.forEach((impressora) => {

      var dados = impressora.querySelector("#franquiaImpressora")
      dados.style.display = "flex"
      setTimeout(() => {
        dados.style.height = "auto"
        dados.style.opacity = "1"
        dados.style.marginTop = "8px"
        dados.style.marginBottom = "12px"
      }, 10)
    })
  } else if (tipo == "ilimitado") {

    section.style.width = "0px"
    section.style.paddingRight = "0px"
    section.style.paddingLeft = "0px"
    section.style.opacity = "0"
    setTimeout(() => {
      section.style.display = "none"
    }, 250)

    impressoras.forEach((impressora) => {

      var dados = impressora.querySelector("#franquiaImpressora")
      dados.style.height = "0px"
      dados.style.opacity = "0"
      dados.style.marginTop = "0px"
      dados.style.marginBottom = "0px"
      setTimeout(() => {
        dados.style.display = "none"
      }, 250)
    })
  }
}

const alterarStatusImpressora = (layout, impressora) => {

  if(!impressora.ativa) {
    impressora.ativa = true
    layout.path[0].className = "fas fa-trash"
    layout.path[0].title = "Deletar impressora"
    layout.path[0].parentNode.style.backgroundColor = "var(--principal)"
  } else {
    impressora.ativa = false
    layout.path[0].className = "fas fa-trash-restore"
    layout.path[0].title = "Restaurar impressora"
    layout.path[0].parentNode.style.backgroundColor = "var(--erro)"
  }
}

const salvarLeituras = (cliente) => {

  var leitura = document.getElementById("leituraExpandida")

  //mostra um load dentro da leitura enquanto não atualiza as informações
  mostrarLoad(document.getElementById(cliente.id))
  var load = document.getElementById("load")
  load.style.height = "inherit"
  load.style.width = "calc(25% - 12px)"
  load.querySelector("img").style.width = "130px"
  load.querySelector("img").style.opacity = "0"
  load.querySelector(".loading").style.marginTop = "-90px"
  load.querySelector(".loading").style.marginBottom = "50px"

  //deleta os dados locais que não precisam serem salvos no DB
  delete cliente.excedentes
  delete cliente.impresso
  delete cliente.impressoras.atraso
  delete cliente.impressoras.inativas

  cliente.franquia.tipo = leitura.querySelector("#tipoFranquia").value
  if(cliente.franquia.tipo == "maquina" || cliente.franquia.tipo == "ilimitado") {
    cliente.franquia.valor = 0
  } else {
    cliente.franquia.valor = leitura.querySelector("#franquiaValor").value.replace(/ págs/g , "")
  }

  var impressoras = cliente.impressoras
  for(var x = 0; x < Object.keys(impressoras).length; x++) {
    var impressora = impressoras[Object.keys(impressoras)[x]]
    //deleta os dados locais que não precisam serem salvos no DB
    delete impressora.excedentes
    delete impressora.impresso
    delete impressora.serial
  }

  document.querySelectorAll('impressora').forEach(el => {
    var impressora = impressoras[el.id]

    impressora.setor = el.querySelector("#setor").value
      if(cliente.franquia.tipo == "maquina") {
        impressora.franquia = parseInt(el.querySelector("#franquia").value.replace(/ págs/g , ""))
      } else {
        impressora.franquia = 0
      }
  })

  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarCliente', {
    params: {
      usuario: usuario.usuario,
      senha: usuario.senha,
      cliente: JSON.stringify(cliente)
    }
  }).then(res => {
    feedbacks--
    feedback(false)
    if(tela == "leituras") {
      preparLeiturasParaListagem(cliente)

      var filtros = document.getElementById("filtrosDeLeituras")
      var filtroSelecionado = filtros.options[filtros.selectedIndex].value
      var novaListagem
      if(filtroSelecionado == "excluidas") {
        novaListagem = criarInterfaceLeitura(cliente, false)
      } else {
        novaListagem = criarInterfaceLeitura(cliente, true)
      }
      setTimeout(() => {
        if(parseInt(novaListagem.querySelector("#impressoras").innerHTML) > 0) {
          esconderLoad()
          document.getElementById("listagem").replaceChild(novaListagem, document.getElementById(cliente.id))
        } else {
          var el = document.getElementById(cliente.id)
          el.style.opacity = "0"
          setTimeout(() => {
            el.remove()
          }, 250)
        }
      }, 100)
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error("Erro ao gravar os dados. Recarregue a página e tente novamente!")
  })
  fecharLeitura()
}

const gerarRelatorio = (cliente) => {

  var meses = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  var dataParaListagem = document.getElementById("datasDeLeiturasExpandida")
  var dataInvertida = dataParaListagem.options[dataParaListagem.selectedIndex].value
  var dataSplit = dataInvertida.split("-")
  var dataDeListagem = meses[parseInt(dataSplit[1])] + "/" + dataSplit[0]
  feedbacks++
  feedback(true)
  var doc = dadosDoRelatorio(cliente, dataParaListagem)
  feedbacks--
  feedback(false)
  doc.save(cliente.nomefantasia + " - " + meses[parseInt(dataSplit[1])] + "_" + dataSplit[0] + ".pdf")
}

const dadosDoRelatorio = (cliente, el) => {

  var meses = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  var dataParaListagem = el
  var dataInvertida = dataParaListagem.options[dataParaListagem.selectedIndex].value
  var dataSplit = dataInvertida.split("-")
  var dataDeListagem = meses[parseInt(dataSplit[1])] + "/" + dataSplit[0]

  var doc = new jsPDF('p', 'mm', [297, 210])
  doc.addImage(pdfLogo, 'PNG', 25, 10, 150, 35)
  doc.setFontSize(16)

  //centra o texto na tela
  var textWidth = doc.getStringUnitWidth(cliente.nomefantasia) * doc.internal.getFontSize() / doc.internal.scaleFactor
  var textOffset = (210 - textWidth) / 2
  doc.text(textOffset, 53, cliente.nomefantasia)
  var line = 60

  doc.setFontSize(14)
  var msg = "Relatorio de páginas impressas - Mês de referência: " + dataDeListagem
  textWidth = doc.getStringUnitWidth(msg) * doc.internal.getFontSize() / doc.internal.scaleFactor
  textOffset = (210 - textWidth) / 2
  doc.text(textOffset, line, msg)
  line = incrementLine(doc, line, 9)

  if(cliente.franquia.tipo == "maquina") {

    var impressoras = cliente.impressoras
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]

      if(impressora.ativa) {
        doc.setFontSize(12)
        doc.text(20, line, impressora.modelo + " - " + impressora.serial)
        line = incrementLine(doc, line, 5)
        doc.text(20, line, "Setor: " + impressora.setor + " - IP: " + impressora.ip)
        line = incrementLine(doc, line, 5)
        doc.text(20, line, "Impressões contabilizadas: " + impressora.impresso + " páginas")
        line = incrementLine(doc, line, 5)

        if(impressora.leituras[dataInvertida] != undefined) {
          var inicial = impressora.leituras[dataInvertida].inicial.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].inicial.valor + " páginas"
          var final = impressora.leituras[dataInvertida].final.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].final.valor + " páginas"
          doc.text(20, line, "Contador inicial: " + inicial)
          line = incrementLine(doc, line, 5)
          doc.text(20, line, "Contador final: " + final)
        } else {
          doc.text(20, line, "Contador inicial: Sem Registro - Contador final: Sem Registro")
        }
        line = incrementLine(doc, line, 5)

        doc.text(20, line, "Franquia contratada: " + impressora.franquia + " páginas" + " - Excedentes: " + impressora.excedentes + " páginas")
        line = incrementLine(doc, line, 8)
      }
    }
  } else {

    if(cliente.franquia.tipo == "pagina"){

      doc.text(20, line, "Franquia contratada: " + cliente.franquia + " páginas - Impressões contabilizadas: " + cliente.impresso + " páginas")
      line = incrementLine(doc, line, 5)
      doc.text(20, line, "Páginas excedentes: " + cliente.excedentes + " páginas")
      line = incrementLine(doc, line, 10)

    } else {
      doc.text(20, line, "Franquia contratada: Ilimitada - Impressões contabilizadas: " + cliente.impresso + " páginas")
      line = incrementLine(doc, line, 10)
    }

    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]

      if(impressora.ativa) {
        doc.setFontSize(12)
        doc.text(20, line, impressora.modelo + " - " + impressora.serial)
        line = incrementLine(doc, line, 5)
        doc.text(20, line, "Setor: " + impressora.setor + " - IP: " + impressora.ip)
        line = incrementLine(doc, line, 5)

        if(impressora.leituras[dataInvertida] != undefined) {
          var inicial = impressora.leituras[dataInvertida].inicial.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].inicial.valor + " páginas"
          var final = impressora.leituras[dataInvertida].final.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].final.valor + " páginas"
          doc.text(20, line, "Contador inicial: " + inicial)
          line = incrementLine(doc, line, 5)
          doc.text(20, line, "Contador final: " + final)
        } else {
          doc.text(20, line, "Contador inicial: Sem Registro - Contador final: Sem Registro")
        }
        line = incrementLine(doc, line, 5)
        doc.text(20, line, "Total impresso: " + impressora.impresso + " páginas")
        line = incrementLine(doc, line, 8)
      }
    }
  }
  return doc
}

const incrementLine = (doc, line, valor) => {
    if (line < 270) {
        line = line + valor
        return line
    } else {
        doc.addPage()
        line = 20
        return line
    }
}

const gerarRelatorios = () => {

  feedbacks++
  feedback(true)
  var salvar = false

  var meses = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  var dataParaListagem = document.getElementById("datasDeLeituras")
  var dataInvertida = dataParaListagem.options[dataParaListagem.selectedIndex].value
  var dataSplit = dataInvertida.split("-")
  var dataDeListagem = meses[parseInt(dataSplit[1])] + "/" + dataSplit[0]
  var zip = new JSZip()

  var relatorioSelect = document.getElementById("relatorioFiltro").value
  var doc = new jsPDF('p', 'mm', [297, 210])
  var line = 30
  
  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]
    if(cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0){
      if(relatorioSelect == "todos") {
        salvar = true
        doc = dadosDoRelatorio(cliente, dataParaListagem)
        zip.file(cliente.nomefantasia + " - " + dataSplit[1] + "_" + dataSplit[0] + ".pdf", doc.output('blob'))

      } else if(relatorioSelect == "interno" && cliente.excedentes > 0) {

        salvar = true
        doc.setFontSize(14)
        textWidth = doc.getStringUnitWidth(cliente.nomefantasia) * doc.internal.getFontSize() / doc.internal.scaleFactor
        textOffset = (210 - textWidth) / 2
        doc.text(textOffset, line, cliente.nomefantasia)
        line = incrementLine(doc, line, 9)

        if(cliente.franquia.tipo == "maquina"){

          var impressoras = cliente.impressoras
          for(var x = 0; x < Object.keys(impressoras).length; x++) {
            var impressora = impressoras[Object.keys(impressoras)[x]]
            if(impressora.ativa) {
              doc.setFontSize(12)
              doc.text(20, line, impressora.modelo + " - " + impressora.serial)
              line = incrementLine(doc, line, 5)
              doc.text(20, line, "Setor: " + impressora.setor + " - IP: " + impressora.ip)
              line = incrementLine(doc, line, 5)
              doc.text(20, line, "Impressões contabilizadas: " + impressora.impresso + " páginas")
              line = incrementLine(doc, line, 5)

              if(impressora.leituras[dataInvertida] != undefined) {
                var inicial = impressora.leituras[dataInvertida].inicial.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].inicial.valor + " páginas"
                var final = impressora.leituras[dataInvertida].final.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].final.valor + " páginas"
                doc.text(20, line, "Contador inicial: " + inicial)
                line = incrementLine(doc, line, 5)
                doc.text(20, line, "Contador final: " + final)
              } else {
                doc.text(20, line, "Contador inicial: Sem Registro - Contador final: Sem Registro")
              }
              line = incrementLine(doc, line, 5)

              doc.text(20, line, "Franquia contratada: " + impressora.franquia + " páginas" + " - Excedentes: " + impressora.excedentes + " páginas")
              line = incrementLine(doc, line, 8)
            }
          }
        } else {
          if(cliente.franquia.tipo == "pagina"){
            doc.text(20, line, "Franquia contratada: " + cliente.franquia + " páginas - Impressões contabilizadas: " + cliente.impresso + " páginas")
            line = incrementLine(doc, line, 5)
            doc.text(20, line, "Páginas excedentes: " + cliente.excedentes + " páginas")
            line = incrementLine(doc, line, 10)

          } else {
            doc.text(20, line, "Franquia contratada: Ilimitada - Impressões contabilizadas: " + cliente.impresso + " páginas")
            line = incrementLine(doc, line, 10)
          }

          var impressoras = cliente.impressoras
          for(var x = 0; x < Object.keys(impressoras).length; x++) {
            var impressora = impressoras[Object.keys(impressoras)[x]]
            if(impressora.ativa) {
              doc.setFontSize(12)
              doc.text(20, line, impressora.modelo + " - " + impressora.serial)
              line = incrementLine(doc, line, 5)
              doc.text(20, line, "Setor: " + impressora.setor + " - IP: " + impressora.ip)
              line = incrementLine(doc, line, 5)

              if(impressora.leituras[dataInvertida] != undefined) {
                var inicial = impressora.leituras[dataInvertida].inicial.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].inicial.valor + " páginas"
                var final = impressora.leituras[dataInvertida].final.dia + "/" + dataDeListagem + " - " + impressora.leituras[dataInvertida].final.valor + " páginas"
                doc.text(20, line, "Contador inicial: " + inicial)
                line = incrementLine(doc, line, 5)
                doc.text(20, line, "Contador final: " + final)
              } else {
                doc.text(20, line, "Contador inicial: Sem Registro - Contador final: Sem Registro")
              }
              line = incrementLine(doc, line, 5)
              doc.text(20, line, "Total impresso: " + impressora.impresso + " páginas")
              line = incrementLine(doc, line, 8)
            }
          }
        }
        var separador = "------------------------------------------------------------------------------------------------------------------------"
        textWidth = doc.getStringUnitWidth(separador) * doc.internal.getFontSize() / doc.internal.scaleFactor
        textOffset = (210 - textWidth) / 2
        doc.text(textOffset, line, separador)
        line = incrementLine(doc, line, 8)
      }
    }
  }

  feedbacks--
  if(salvar) {
    feedback(false)
    if(relatorioSelect == "todos") {
      zip.generateAsync({type:"blob"}).then(function (blob) {
        saveAs(blob, meses[parseInt(dataSplit[1])] + "_" + dataSplit[0] + ".zip")
      })
    } else if(relatorioSelect == "interno") {
      doc.save("interno - " + meses[parseInt(dataSplit[1])] + "_" + dataSplit[0] + ".pdf")
    }
  } else {
    error("Clientes sem excedentes para gerar o relatório!")
  }
}

/*
*
* funções sobre os clientes
*
*/
const selecionarClientes = () => {
  if(tela != "clientes") {
    tela = "clientes"
    document.getElementById("listagem").innerHTML = ""
    listagem(false)
  }
}

const listagemClientes = () => {
  var container = document.getElementById("tPessoasContainer").content.cloneNode(true)
  var ativos = new DocumentFragment()
  var inativos = new DocumentFragment()
  var fornecedores = new DocumentFragment()

  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]
    var interface = document.getElementById("tCliente").content.cloneNode(true)

    interface.querySelector("#expandir").onclick = ((cliente) => {
      return function(){expandirCliente(cliente)}
    })(cliente)

    interface.querySelector("#excluir").onclick = ((cliente) => {
      return function(){excluirCliente(cliente)}
    })(cliente)

    interface.querySelector(".cliente").id = cliente.id
    interface.querySelector("#nome").innerHTML = cliente.nomefantasia
    interface.querySelector("#chave").innerHTML = "Chave: " + cliente.id

    if(!cliente.ativo) {
      interface.querySelector("#excluir").className = "fas fa-trash-restore green"
      inativos.appendChild(interface)
    } else {
      if(cliente.fornecedor) {
        fornecedores.appendChild(interface)
      } else {
        ativos.appendChild(interface)
      }
    }
  }
  container.querySelector("#ativos").appendChild(ativos)
  container.querySelector("#inativos").appendChild(inativos)
  container.querySelector("#fornecedores").appendChild(fornecedores)
  document.getElementById("listagem").appendChild(container)
}

const expandirCliente = (cliente) => {
  var layout = document.getElementById("tClienteExpandido").content.cloneNode(true)
  layout.querySelector("#salvar").onclick = () => {salvarCliente(cliente)}
  layout.querySelector("#printers").onclick = () => {
    if(cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0) {
      fecharCliente()
      selecionarLeituras()
      setTimeout(() => {
        expandirLeitura(cliente)
      }, 350)
    } else {
      error("Cliente não tem nenhuma impressora para listar!")
    }
  }

  if(cliente != undefined) {
    layout.querySelector("clienteExpandido").id = cliente.id
    preencherCliente(cliente, layout)
    if(cliente.fornecedor) {
      layout.querySelector("#nome").innerHTML = "Editar Fornecedor"
    } else {
      layout.querySelector("#nome").innerHTML = "Editar Cliente"
    }
  } else {
    layout.querySelector("#nome").innerHTML = "Cadastrar Pessoa"
    layout.querySelector(".tipo").style.display = "block"
  }
  if(tela != "leituras" && cliente != undefined && cliente.ativo) {
    layout.querySelector("#printers").style.display = "block"
  }
  document.body.appendChild(layout)

  $("#celular").mask("(00) 00000-0000")
	$("#telefone").mask("(00) 0000-0000")
	$("#cep").mask("00000-000")
  $("#numero").mask("0000000")
  $("#estado").mask("AA")
  $(".hora").mask("00:00")

  var options = {
    onKeyPress: (cpf, ev, el, op) => {
      var masks = ['000.000.000-000', '00.000.000/0000-00']
      $('#cpfcnpj').mask((cpf.length > 14) ? masks[1] : masks[0], op)
    }
  }
  $('#cpfcnpj').length > 11 ? $('#cpfcnpj').mask('00.000.000/0000-00', options) : $('#cpfcnpj').mask('000.000.000-00#', options)

  setTimeout(() => {
    document.getElementById("clienteExpandido").style.opacity = "1"
  }, 50)
}

const excluirCliente = (cliente) => {

  if(cliente.ativo) {
    if(confirm("Deseja desativar o cliente? Isso NÂO vai excluir os dados!")) {
      cliente.ativo = false
      gravarCliente(cliente)
    }
  } else {
    if(confirm("Deseja reativar o cliente?")) {
      cliente.ativo = true
      gravarCliente(cliente)
    }
  }
}

const preencherCliente = (cliente, layout) => {

  layout.querySelector("#razaosocial").value = toTitleCase(cliente.razaosocial)
  layout.querySelector("#nomefantasia").value = toTitleCase(cliente.nomefantasia)
  layout.querySelector("#cpfcnpj").value = cliente.cpfcnpj
  layout.querySelector("#email").value = cliente.contato.email
  layout.querySelector("#telefone").value = cliente.contato.telefone
  layout.querySelector("#celular").value = cliente.contato.celular
  layout.querySelector("#endereco").value = toTitleCase(cliente.endereco.rua)
  layout.querySelector("#numero").value = cliente.endereco.numero
  layout.querySelector("#bairro").value = toTitleCase(cliente.endereco.bairro)
  layout.querySelector("#cidade").value = toTitleCase(cliente.endereco.cidade)
  layout.querySelector("#estado").value = cliente.endereco.estado
  layout.querySelector("#cep").value = cliente.endereco.cep
  layout.querySelector("#complemento").value = cliente.endereco.complemento

  var semana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]
  var horarios = cliente.horarios
  for(var x = 0; x < 7; x++) {
    if(horarios[semana[x]].aberto) {
      layout.querySelector("#" + semana[x]).checked = true
      mostrarHorarios(layout.querySelector("#" + semana[x]))
      var horario = horarios[semana[x]].horario
      layout.querySelector("#" + semana[x] + "De1").value = horario[0].split(" - ")[0]
      layout.querySelector("#" + semana[x] + "Ate1").value = horario[0].split(" - ")[1]
      layout.querySelector("#" + semana[x] + "De2").value = horario[1].split(" - ")[0]
      layout.querySelector("#" + semana[x] + "Ate2").value = horario[1].split(" - ")[1]
    }
  }
}

const salvarCliente = (cliente) => {

  var ok = true
  var layout = document.getElementById("clienteExpandido")

  if(layout.querySelector("#razaosocial").value == "") {
    ok = false
    layout.querySelector("#razaosocial").reportValidity()
  } else if(layout.querySelector("#nomefantasia").value == "") {
    ok = false
    layout.querySelector("#nomefantasia").reportValidity()
  } else if(layout.querySelector("#telefone").value == "") {
    if(layout.querySelector("#celular").value == ""){
      ok = false
      layout.querySelector("#telefone").reportValidity()
    }
  } else if(layout.querySelector("#endereco").value == "") {
    ok = false
    layout.querySelector("#endereco").reportValidity()
  } else if(layout.querySelector("#numero").value == "") {
    ok = false
    layout.querySelector("#numero").reportValidity()
  } else if(layout.querySelector("#cidade").value == "") {
    ok = false
    layout.querySelector("#cidade").reportValidity()
  } else if(layout.querySelector("#estado").value == "") {
    ok = false
    layout.querySelector("#estado").reportValidity()
  }

  if(ok) {
    if(cliente == undefined) {
      var data = new Date()
      cliente = new Object()
      cliente.contato = new Object()
      cliente.endereco = new Object()
      cliente.id = data.getTime() + ""
      cliente.ativo = true

      cliente.franquia = {
        tipo: "ilimitado",
        valor: 0
      }
      cliente.fornecedor = false
      var tipo = layout.querySelector("#tipoCliente").value
      if(tipo == 'fornecedor') {
        cliente.fornecedor = true
      }
      cliente.sistema = {
        local: btoa("Não Instalado"),
        versao: "Não Instalado"
      }
      clientes.push(cliente)
    }

    cliente.nomefantasia = toTitleCase(layout.querySelector("#nomefantasia").value)
    cliente.razaosocial = toTitleCase(layout.querySelector("#razaosocial").value)
    cliente.contato.telefone = layout.querySelector("#telefone").value
    cliente.contato.celular = layout.querySelector("#celular").value
    cliente.contato.email = layout.querySelector("#email").value.toLowerCase()
    cliente.cpfcnpj = layout.querySelector("#cpfcnpj").value

    cliente.endereco.rua = toTitleCase(layout.querySelector("#endereco").value)
    cliente.endereco.numero = layout.querySelector("#numero").value
    cliente.endereco.bairro = toTitleCase(layout.querySelector("#bairro").value)
    cliente.endereco.cidade = toTitleCase(layout.querySelector("#cidade").value)
    cliente.endereco.estado = layout.querySelector("#estado").value
    cliente.endereco.cep = layout.querySelector("#cep").value
    cliente.endereco.complemento = layout.querySelector("#complemento").value

    var semana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]
    var horarios = new Object()
    for(var x = 0; x < 7; x++) {
      horarios[semana[x]] = new Object()
      if(layout.querySelector("#" + semana[x]).checked) {
        horarios[semana[x]].aberto = true
        horarios[semana[x]].horario = []
        var a = layout.querySelector("#" + semana[x] + "De1").value + " - " + layout.querySelector("#" + semana[x] + "Ate1").value
        var b = layout.querySelector("#" + semana[x] + "De2").value + " - " + layout.querySelector("#" + semana[x] + "Ate2").value
        horarios[semana[x]].horario.push(a)
        horarios[semana[x]].horario.push(b)
      } else {
        horarios[semana[x]].aberto = false
      }
    }
    cliente.horarios = horarios
    fecharCliente()
    gravarCliente(cliente)
  }
}

const gravarCliente = (cliente) => {

  //deleta os dados locais que não precisam serem salvos no DB
  delete cliente.excedentes
  delete cliente.impresso

  if(cliente.franquia.tipo == "maquina" || cliente.franquia.tipo == "ilimitado") {
    cliente.franquia.valor = 0
  }

  var impressoras = cliente.impressoras
  if(impressoras != undefined && Object.keys(impressoras).length > 0) {
    delete cliente.impressoras.atraso
    delete cliente.impressoras.inativas
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]
      //deleta os dados locais que não precisam serem salvos no DB
      delete impressora.excedentes
      delete impressora.impresso
      delete impressora.serial
      if(cliente.franquia.tipo != "maquina") {
        impressora.franquia = 0
      }
    }
  }

  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarCliente', {
    params: {
      usuario: usuario.usuario,
      senha: usuario.senha,
      cliente: JSON.stringify(cliente)
    }
  }).then(res => {
    feedbacks--
    feedback(false)
    if(tela == "clientes") {
      document.getElementById("listagem").innerHTML = ""
      setTimeout(() => {
        listagem(false)
      }, 300)
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error("Erro ao gravar os dados. Recarregue a página e tente novamente!")
  })
}

const toTitleCase = (str) => {
  return str.toLowerCase().replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const fecharCliente = () => {
  var clienteExpandido = document.getElementById("clienteExpandido")
  clienteExpandido.style.opacity = "0"
  setTimeout(() => {
    clienteExpandido.remove()
  }, 250)
}

const mostrarHorarios = (element) => {
  var dia = element.id
  var layout = element.parentNode.parentNode

  if(element.checked) {
    layout.querySelector(".horarios").style.height = "48px"
    layout.querySelector(".horarios").style.opacity = "1"
  } else {
    layout.querySelector(".horarios").style.height = "0px"
    layout.querySelector(".horarios").style.opacity = "0"
  }
}
