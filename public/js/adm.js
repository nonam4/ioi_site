//clientes, leituras, dashboard, atendimentos, suprimentos, empresa
var tela = 'leituras'
var feedbacks = 0

//var dashboard
var usuarios
//var empresa
var suprimentos
var clientes
var atendimentos
var versao

const autenticacao = () => {
  mostrarLoad(document.body)
  //quando a página acabar de carregar o sistema checa se o usuario esta autenticado ou não
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  if(usuario != null){
    receberDados(usuario)
  } else {
    error('Você não deveria estar aqui. Redirecionando para a autenticação!')
    setTimeout(() => {
      window.location = 'auth.html'
    }, 7000)
  }
}

const logout = () => {
  localStorage.setItem('usuario', null)
  mostrarLoad(document.body)
  window.location = 'auth.html'
}

const receberDados = usuario => {
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/dados', {
    params: {
      plataforma: 'web',
      usuario: usuario.usuario,
      senha: usuario.senha
    }
  }).then(res => {
    if(res.data.auth.autenticado) {

      var usuario = {
        nome: res.data.auth.nome,
        usuario: res.data.auth.usuario,
        senha: res.data.auth.senha,
        empresa: res.data.auth.empresa,
        permissao: res.data.auth.permissao
      }
      localStorage.setItem('usuario', JSON.stringify(usuario))
      
      //dashboard = res.data.dashboard
      usuarios = res.data.usuarios
      //empresa = res.data.empresa
      suprimentos = res.data.suprimentos
      clientes = res.data.clientes
      atendimentos = res.data.atendimentos
      versao = res.data.versao
      document.getElementById('menu').style.opacity = '1'
      listagem(true)
    } else {
      error('Você não deveria estar aqui. Redirecionando para a autenticação!')
      setTimeout(() => {
        window.location = 'auth.html'
      }, 7000)
    }
  }).catch(err => {
    esconderLoad()
    setTimeout(() => {
      console.error(err)
      error('Tivemos algum problema ao processar os dados. Tente novamente mais tarde!')
    }, 250)
  })
}

const listagem = criarFiltros => {
  mostrarLoad(document.body)
  setTimeout(() => {
    switch (tela) {
      case 'leituras':
        if(criarFiltros) { filtrosLeituras() }
        listagemLeituras()
        break
      case 'clientes':
        listagemClientes()
        break
      case 'atendimentos':
        listagemAtendimentos()
        break
      case 'suprimentos':
        listagemSuprimentos()
        break
    }
    esconderLoad()
  }, 300)
}

const mostrarLoad = el => {
  var load = document.getElementById('tLoad').content.cloneNode(true)
  el.appendChild(load)
  el.querySelector('#load').style.display = 'flex'

  setTimeout(() => {
    el.querySelector('#load').style.opacity = '1'
  }, 50)
}

const esconderLoad = () => {
  var load = document.body.querySelector('#load')
  load.style.opacity = '0'

  setTimeout(() => {
    load.remove()
  }, 250)
}

const error = message => {
  document.getElementById('error').style.bottom = '0px'
  document.getElementById('error').innerHTML = message

  setTimeout(() => {
    document.getElementById('error').style.bottom = '-100px'
  }, 7000)
}

const feedback = a => {
  var processando = 'Processando ' + feedbacks + ' trabalhos, por favor aguarde!'
  var concluido = 'Todos os trabalhos foram concluídos'
  document.getElementById('feedback').style.bottom = '0px'
  if(a) {
    document.getElementById('feedback').innerHTML = processando
  } else {
    document.getElementById('feedback').innerHTML = concluido
  }

  setTimeout(() => {
    document.getElementById('feedback').style.bottom = '-100px'
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
  var filtros = document.getElementById('tFiltrosLeitura').content.cloneNode(true)
  document.getElementById('listagem').appendChild(filtros)
  gerarDatasDeListagem()
}

const gerarDatasDeListagem = () => {
  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if(mes < 10) { mes = '0' + mes }

  var datas = document.getElementById('datasDeLeituras')
  datas.innerHTML = ''
	//preenche os meses disponiveis
	for(var x = 0; x < 4; x++){

    var data = document.createElement('option')
    data.value = ano + '-' + mes
    data.innerHTML = mes + '/' + ano
    datas.appendChild(data)

		if(mes <= 1){
			mes = 12
			ano = ano - 1
		} else {
			mes = mes - 1
      if (mes < 10) { mes = '0' + mes }
		}
	}
}

/*
* separa as leituras de acordo com os filtros e cria a interface por fim
*/
const compare = (vlocal, vserver) => {
  var result = false
  if(typeof vlocal !== 'object'){ vlocal = vlocal.toString().split('.') }
  if(typeof vserver !== 'object'){ vserver = vserver.toString().split('.') }

  for(var i = 0; i < (Math.max(vlocal.length, vserver.length)); i++){
      if(vlocal[i] == undefined){ vlocal[i]= 0 }
      if(vserver[i] == undefined){ vserver[i] = 0 }

      if(Number(vlocal[i]) < Number(vserver[i])){
          result = true
          break
      }
      if(vlocal[i] != vserver[i]){
          break
      }
  }
  return result
}

const listagemLeituras = () => {

  var filtros = document.getElementById('filtrosDeLeituras')
  var filtroSelecionado = filtros.options[filtros.selectedIndex].value
  var interfaces = new DocumentFragment()

  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]

    if(cliente.ativo && cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0) {
      cliente = preparLeiturasParaListagem(cliente)

      if(filtroSelecionado == 'todas') {
        interfaces.appendChild(criarInterfaceLeitura(cliente, true))
      } else if(filtroSelecionado == 'alertas' && (compare(cliente.sistema.versao, versao) || cliente.impressoras.atraso)){
        interfaces.appendChild(criarInterfaceLeitura(cliente, true))
      } else if(filtroSelecionado == 'excedentes' && cliente.excedentes > 0){
        interfaces.appendChild(criarInterfaceLeitura(cliente, true))
      } else if(filtroSelecionado == 'excluidas'  && cliente.impressoras.inativas) {
        interfaces.appendChild(criarInterfaceLeitura(cliente, false))
      }
    }
  }
  document.getElementById('listagem').appendChild(interfaces)
}

const preparLeiturasParaListagem = cliente => {

  var datas = document.getElementById('datasDeLeituras')
  var listagem = datas.options[datas.selectedIndex].value

  if(cliente.franquia.valor == undefined || cliente.franquia.valor == null 
    || cliente.franquia.tipo == 'maquina' || cliente.franquia.tipo == 'ilimitado') {
    cliente.franquia.valor = 0
  }

  if(cliente.franquia.preco == undefined || cliente.franquia.preco == null) {
    cliente.franquia.preco = 0
  }

  cliente.impresso = 0
  cliente.excedentes = 0
  cliente.impressoras.atraso = false
  cliente.impressoras.inativas = false
  cliente.abastecimento = false
  var impressoras = cliente.impressoras

  if(impressoras != undefined && impressoras != null) {
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]
      if(impressora.leituras != undefined && impressora.ativa) {
        impressora.serial = Object.keys(impressoras)[x]
        impressora.impresso = 0
        impressora.excedentes = 0
        /*
        * define a franquia total do cliente se a franquia for separada por maquinas
        */
        if(cliente.franquia.tipo !== 'ilimitado' && cliente.franquia.tipo !== 'pagina') {
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
          if(impressora.impresso > impressora.franquia && cliente.franquia.tipo == 'maquina') {
            impressora.excedentes = impressora.impresso - impressora.franquia
            cliente.excedentes = cliente.excedentes + impressora.excedentes
          }

          if(impressora.tinta.capacidade != 'ilimitado' && impressora.tinta.nivel <= 0) {
            cliente.abastecimento = true
          }

          //checa se o ultimo dia de leitura foi a mais de 5 dias atrás
          var a = new Date()
          //precisa adicionar + 1 no dia pois senão se o valor for 10 pegará o dia 9
          var b = new Date(listagem + '-' + (parseInt(impressora.leituras[listagem].final.dia) + 1))
          if(Math.ceil(Math.abs(a - b) / (1000 * 3600 * 24)) > 5 && impressora.ativa){
            cliente.impressoras.atraso = true
          }
        } else if(impressora.ativa) {
          cliente.impressoras.atraso = true
        }
      } else if(impressora.leituras != undefined && !impressora.ativa) {
        cliente.impressoras.inativas = true
      }
    }
  }

  if(cliente.franquia.tipo == 'pagina') {
    if(cliente.franquia.valor < cliente.impresso) {
    cliente.excedentes = cliente.impresso - cliente.franquia.valor
    }
  }
  return cliente
}

const criarInterfaceLeitura = (cliente, ativas) => {
  var leitura = document.getElementById('tLeitura').content.cloneNode(true)
  
  leitura.querySelector('.leituraTitulo').querySelector('i').onclick = (cliente => {
    return () => {expandirLeitura(cliente)}
  })(cliente)

  //id principal
  leitura.querySelector('leitura').id = cliente.id
  if(cliente.sistema.versao == 'Não instalado' || compare(cliente.sistema.versao, versao)){
    leitura.querySelector('.leituraTitulo').style.backgroundColor = 'var(--erro)'
  } else if(cliente.impressoras.atraso) {
    leitura.querySelector('.leituraTitulo').style.backgroundColor = 'var(--alerta)'
  }
  //define o nome do cliente na leitura
  leitura.querySelector('#nome').innerHTML = cliente.nomefantasia
  //define a versão do coletor
  leitura.querySelector('#versao').innerHTML = cliente.sistema.versao
  //define o numero de impressoras (precisa subtrair 2 do length pois tem duas variáveis definidas junto)
  leitura.querySelector('#impressoras').innerHTML = pegarQuantidadeImpressoras(ativas, cliente.impressoras)
  
  if(cliente.abastecimento) {
    leitura.querySelector('.tintas').style.width = '100%'
    leitura.querySelector('.tintas').style.maxWidth = '33.33%'
    leitura.querySelector('.tintas').style.padding = '0px 4px 0px 4px'
    leitura.querySelector('.tintas').style.display = 'block'
    leitura.querySelector('.tintas').style.opacity = '1'
  }

  if(ativas) {
    //define o numero de excedentes
    leitura.querySelector('#excedentes').innerHTML = cliente.excedentes + ' págs'
  } else {
    leitura.querySelector('#excedentes').innerHTML = 'Excluídas'
  }
  
  //define a franquia
  if(cliente.franquia.tipo == 'ilimitado') {
    leitura.querySelector('#franquia').innerHTML = 'S/F'
  } else {
    leitura.querySelector('#franquia').innerHTML = cliente.franquia.valor + ' págs'
  }
  if(ativas) {
    //define o total impresso
    leitura.querySelector('#impresso').innerHTML = cliente.impresso + ' págs'
  } else {
    leitura.querySelector('#impresso').innerHTML = 'Excluídas'
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
const expandirLeitura = cliente => {

  var listagens = document.getElementById('listagem').querySelector('#filtrosDeLeituras')
  var listagem = listagens.options[listagens.selectedIndex].value
  var datas = document.getElementById('listagem').querySelector('#datasDeLeituras')
  var data = datas.options[datas.selectedIndex].value

  var expandida = document.getElementById('tLeituraExpandida').content.cloneNode(true)
  expandida.querySelector('leituraexpandida').id = cliente.id
  expandida.querySelector('#editCliente').onclick = () => {expandirCliente(cliente)}
  expandida.querySelector('#salvar').onclick = () => {salvarLeituras(cliente)}
  expandida.querySelector('#relatorio').onclick = () => {gerarRelatorio(cliente)}
  //define o nome na leitura expandida
  expandida.querySelector('#nome').innerHTML = cliente.nomefantasia
  //permite que se altere as datas dentro do cliente expandido
  expandida.querySelector('#datasDeLeiturasExpandida').onchange = () => {alterarListagemLeituraExpandida(cliente)}
  //define o total impresso
  expandida.querySelector('#impresso').innerHTML = cliente.impresso + ' págs'
  //define o valor por excedentes
  $('#excedenteValor').mask('0,00', {reverse: true})
  if(cliente.franquia.preco > 0) {
    expandida.querySelector('#excedenteValor').value = cliente.franquia.preco.toFixed(2)
  }
  var valor
  if(cliente.franquia.tipo == 'ilimitado') {
    valor = (cliente.franquia.preco * cliente.impresso).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
  } else {
    valor = (cliente.franquia.preco * cliente.excedentes).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
  }
  expandida.querySelector('#excedentes').innerHTML = cliente.excedentes + ' págs - ' + valor
  //define dados do rodapé
  expandida.querySelector('#chave').innerHTML = 'Chave do cliente: ' + cliente.id
  expandida.querySelector('#local').innerHTML = 'Local inst. do coletor: ' + atob(cliente.sistema.local)
  expandida.querySelector('#versao').innerHTML = 'Versão do coletor: ' + cliente.sistema.versao

  var interfaces = new DocumentFragment()
  var impressoras = cliente.impressoras
  for(var x = 0; x < Object.keys(impressoras).length; x++) {
    var impressora = impressoras[Object.keys(impressoras)[x]]
    if(impressora.modelo != undefined) {
      if(listagem == 'excluidas' && !impressora.ativa) {
        interfaces.appendChild(criarInterfaceImpressora(impressora, true, data))
      } else if(impressora.ativa && listagem != 'excluidas') {
        interfaces.appendChild(criarInterfaceImpressora(impressora, false, data))
      }
    }
  }
  expandida.querySelector('#impressoras').appendChild(interfaces)

  if(cliente.franquia.tipo == 'pagina'){
    expandida.querySelector('#tipoFranquia').selectedIndex = '1'
  } else if(cliente.franquia.tipo == 'maquina') {
    expandida.querySelector('#tipoFranquia').selectedIndex = '2'
  } else if(cliente.franquia.tipo == 'ilimitado') {
    expandida.querySelector('#tipoFranquia').selectedIndex = '0'
  }
  alterarTipoFranquia(expandida.querySelector('#tipoFranquia'))

  expandida.querySelector('#franquiaValor').value = cliente.franquia.valor
  converterNumeroPagina(expandida.querySelector('#franquiaValor'))

  document.body.appendChild(expandida)
  gerarDatasExpandida()
  setTimeout(() => {
    document.getElementById('leituraExpandida').style.opacity = '1'
  }, 10)
}

const gerarDatasExpandida = () => {
  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if(mes < 10) { mes = '0' + mes }

  var datasMaster = document.getElementById('listagem').querySelector('#datasDeLeituras')
  var dataMaster = datasMaster.options[datasMaster.selectedIndex].value

  var datas = document.getElementById('datasDeLeiturasExpandida')
  datas.innerHTML = ''
	//preenche os meses disponiveis
	for(var x = 0; x < 4; x++){

    var data = document.createElement('option')
    data.value = ano + '-' + mes
    data.innerHTML = mes + '/' + ano
    datas.appendChild(data)
    if(data.value == dataMaster) {
      datas.selectedIndex = x
    }

		if(mes <= 1){
			mes = 12
			ano = ano - 1
		} else {
			mes = mes - 1
      if (mes < 10) { mes = '0' + mes }
		}
	}
}

const fecharLeitura = () => {
  var leituraExpandida = document.getElementById('leituraExpandida')
  leituraExpandida.style.opacity = '0'
  setTimeout(() => {
    leituraExpandida.remove()
  }, 200)
}

/*
* cria a interface da leitura expandida
*/
const criarInterfaceImpressora = (impressora, excluidas, listagem) => {

  var data = listagem.split('-')[1] + '/' + listagem.split('-')[0]

  var layout = document.getElementById('tImpressora').content.cloneNode(true)
  layout.querySelector('impressora').id = impressora.serial
  layout.querySelector('#modelo').innerHTML = impressora.modelo
  layout.querySelector('#deletar').onclick = element => {alterarStatusImpressora(element, impressora)}
  layout.querySelector('#setor').value = impressora.setor
  layout.querySelector('#serial').innerHTML = impressora.serial
  layout.querySelector('#serial').title = impressora.serial
  layout.querySelector('#ip').innerHTML = impressora.ip
  layout.querySelector('#ip').title = impressora.ip
  layout.querySelector('#impresso').innerHTML = impressora.impresso + ' págs'
  layout.querySelector('#franquia').value = impressora.franquia + ' págs'
  layout.querySelector('#excedentes').innerHTML = impressora.excedentes + ' págs'

  if(impressora.leituras != undefined && impressora.leituras[listagem] != undefined) {
    layout.querySelector('#inicial').innerHTML = impressora.leituras[listagem].inicial.dia + '/' + data + ' - ' + impressora.leituras[listagem].inicial.valor + ' págs'
    layout.querySelector('#final').innerHTML = impressora.leituras[listagem].final.dia + '/' + data + ' - ' + impressora.leituras[listagem].final.valor + ' págs'
  } else {
    layout.querySelector('#inicial').innerHTML = 'Sem Registro'
    layout.querySelector('#final').innerHTML = 'Sem Registro'
  }

  if(impressora.tinta.capacidade != 'ilimitado') {

    layout.querySelector('#capacidade').value = impressora.tinta.capacidade
    layout.querySelector('#nivel').innerHTML = impressora.tinta.nivel + '%'
    layout.querySelector('#total').innerHTML = impressora.tinta.impresso + ' págs'

    layout.querySelector('#abastecimento').onclick = (impressora => {
      return () => { encherTinta(impressora) }
    })(impressora)
  } else {
    layout.querySelector('#capacidade').value = 'ilimitado'
    layout.querySelector('#nivel').innerHTML = '∞'
    layout.querySelector('#total').innerHTML = '-'

    layout.querySelector('#abastecimento').style.cursor = 'default'
  }

  if(excluidas) {
    layout.querySelector('#deletar').className = 'fas fa-trash-restore'
    layout.querySelector('#deletar').title = 'Restaurar impressora'
    layout.querySelector('.leituraTitulo').style.backgroundColor = 'var(--erro)'
  }

  return layout
}

const encherTinta = impressora => {
  impressora.tinta.cheio = impressora.tinta.cheio + impressora.tinta.impresso
  impressora.tinta.impresso = 0
  impressora.tinta.nivel = 100

  document.getElementById(impressora.serial).querySelector('#nivel').innerHTML = '100%'
}

/*
* converte '000 págs' em '000' ou vice versa
*/
const converterNumeroPagina = elemento => {

  if(elemento.value != ''){
    var numbersOnly = /^\d+$/.test(elemento.value)
    if(numbersOnly){
      elemento.value = elemento.value + ' págs'
    } else {
      elemento.value = ''
      alert('Franquia inválida')
    }
  }
}

var converterPaginaNumero = elemento => {
  elemento.value = elemento.value.replace(/ págs/g , '')
}

/*
* altera a listagem das leituras
*/
//limpa tudo, cria os filtros e lista as leituras do zero
const selecionarLeituras = () => {
  if(tela != 'leituras') {
    tela = 'leituras'
    document.getElementById('listagem').innerHTML = ''
    listagem(true)
  }
}

const alterarListagemLeitura = () => {
  document.querySelectorAll('leitura').forEach(el => {
    el.remove()
  })
  listagem(false)
}

const alterarListagemLeituraExpandida = cliente => {
  document.querySelectorAll('impressora').forEach(el => {
    el.remove()
  })
  mostrarLoad(document.getElementById('conteudo').querySelector('#impressoras'))
  var listagens = document.getElementById('datasDeLeiturasExpandida')
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
        if(cliente.franquia.tipo !== 'ilimitado' && cliente.franquia.tipo !== 'pagina') {
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
          var b = new Date(listagem + '-' + (parseInt(impressora.leituras[listagem].final.dia) + 1))

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

  if(cliente.franquia.tipo !== 'ilimitado') {
    if(cliente.franquia.valor < cliente.impresso) {
    cliente.excedentes = cliente.impresso - cliente.franquia.valor
    } else {
      cliente.excedentes = 0
    }
  }

  setTimeout(() => {
    var expandida = document.getElementById('leituraExpandida')
    //define o total impresso
    expandida.querySelector('#impresso').innerHTML = cliente.impresso + ' págs'
    //define o valor dos excedentes
    expandida.querySelector('#excedentes').innerHTML = cliente.excedentes + ' págs'

    var interfaces = new DocumentFragment()
    var impressoras = cliente.impressoras
    if(impressoras != undefined && impressoras != null) {
      for(var x = 0; x < Object.keys(impressoras).length; x++) {
        var impressora = impressoras[Object.keys(impressoras)[x]]
        if(impressora.ativa) {
          interfaces.appendChild(criarInterfaceImpressora(impressora, false, listagem))
        }
      }
      expandida.querySelector('#impressoras').appendChild(interfaces)
    }
    esconderLoad()
  }, 300)
}

/*
* altera a franquia do cliente quando a leitura está expandida
*/
const alterarTipoFranquia = elemento => {

  var tipo = elemento.value
  //vai pra section com id de conteudo
  var container = elemento.parentNode.parentNode.parentNode.parentNode
  var section = container.querySelector('#franquiaContainer')
  var valores = container.querySelector('#valoresContainer')
  var excedentes = container.querySelector('#excedenteContainer')
  var impressoras = container.querySelectorAll('impressora')

  var cliente = clientes[container.parentNode.id]
  var valor
  if(tipo == 'ilimitado') {
    valor = (cliente.franquia.preco * cliente.impresso).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
  } else {
    valor = (cliente.franquia.preco * cliente.excedentes).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
  }

  if(tipo == 'pagina') {

    valores.querySelector('.filtroTitulo').innerHTML = 'Valor Excedente'
    container.querySelector('#excedentes').innerHTMl = cliente.excedentes + ' págs - ' + valor
    container.querySelector('#impresso').innerHTML = cliente.impresso + ' págs'

    valores.style.borderRight = "solid 1px var(--bordas)"
    section.style.display = 'block'
    excedentes.style.display = 'block'
    setTimeout(() => {
      section.style.width = '100%'
      section.style.paddingRight = '12px'
      section.style.paddingLeft = '12px'
      section.style.opacity = '1'
      
      excedentes.style.width = '100%'
      excedentes.style.paddingRight = '12px'
      excedentes.style.paddingLeft = '12px'
      excedentes.style.opacity = '1'
    }, 10)

    impressoras.forEach(impressora => {

      var dados = impressora.querySelector('#franquiaImpressora')
      dados.style.height = '0px'
      dados.style.opacity = '0'
      dados.style.marginTop = '0px'
      dados.style.marginBottom = '0px'
      setTimeout(() => {
        dados.style.display = 'none'
      }, 250)
    })

  } else if (tipo == 'maquina'){

    valores.querySelector('.filtroTitulo').innerHTML = 'Valor Excedente'
    container.querySelector('#excedentes').innerHTMl = cliente.excedentes + ' págs - ' + valor
    container.querySelector('#impresso').innerHTML = cliente.impresso + ' págs'

    valores.style.borderRight = "solid 1px var(--bordas)"
    section.style.width = '0px'
    section.style.paddingRight = '0px'
    section.style.paddingLeft = '0px'
    section.style.opacity = '0'

    setTimeout(() => {
      section.style.display = 'none'
    }, 250)

    excedentes.style.display = 'block'
    setTimeout(() => {
      
      excedentes.style.width = '100%'
      excedentes.style.paddingRight = '12px'
      excedentes.style.paddingLeft = '12px'
      excedentes.style.opacity = '1'
    }, 10)

    impressoras.forEach(impressora => {

      var dados = impressora.querySelector('#franquiaImpressora')
      dados.style.display = 'flex'
      setTimeout(() => {
        dados.style.height = 'auto'
        dados.style.opacity = '1'
        dados.style.marginTop = '8px'
        dados.style.marginBottom = '12px'
      }, 10)
    })
  } else if (tipo == 'ilimitado') {

    valores.querySelector('.filtroTitulo').innerHTML = 'Valor Página'
    container.querySelector('#impresso').innerHTML = cliente.impresso + ' págs - ' + valor
    
    valores.style.borderRight = "solid 0px var(--bordas)"
    section.style.width = '0px'
    section.style.paddingRight = '0px'
    section.style.paddingLeft = '0px'
    section.style.opacity = '0'

    excedentes.style.width = '0px'
    excedentes.style.paddingRight = '0px'
    excedentes.style.paddingLeft = '0px'
    excedentes.style.opacity = '0'
    setTimeout(() => {
      section.style.display = 'none'
      excedentes.style.display = 'none'
    }, 250)

    impressoras.forEach(impressora => {

      var dados = impressora.querySelector('#franquiaImpressora')
      dados.style.height = '0px'
      dados.style.opacity = '0'
      dados.style.marginTop = '0px'
      dados.style.marginBottom = '0px'
      setTimeout(() => {
        dados.style.display = 'none'
      }, 250)
    })
  }
}

const alterarStatusImpressora = (layout, impressora) => {

  if(!impressora.ativa) {
    impressora.ativa = true
    layout.path[0].className = 'fas fa-trash'
    layout.path[0].title = 'Deletar impressora'
    layout.path[0].parentNode.style.backgroundColor = 'var(--principal)'
  } else {
    impressora.ativa = false
    layout.path[0].className = 'fas fa-trash-restore'
    layout.path[0].title = 'Restaurar impressora'
    layout.path[0].parentNode.style.backgroundColor = 'var(--erro)'
  }
}

const salvarLeituras = cliente => {

  var leitura = document.getElementById('leituraExpandida')

  //mostra um load dentro da leitura enquanto não atualiza as informações
  mostrarLoad(document.getElementById(cliente.id))
  var load = document.getElementById('load')
  load.style.height = 'inherit'
  load.style.width = 'calc(25% - 12px)'
  load.querySelector('img').style.width = '130px'
  load.querySelector('img').style.opacity = '0'
  load.querySelector('.loading').style.marginTop = '-90px'
  load.querySelector('.loading').style.marginBottom = '50px'

  //deleta os dados locais que não precisam serem salvos no DB
  delete cliente.excedentes
  delete cliente.impresso
  delete cliente.impressoras.atraso
  delete cliente.impressoras.inativas
  delete cliente.abastecimento

  cliente.franquia.tipo = leitura.querySelector('#tipoFranquia').value
  if(cliente.franquia.tipo == 'maquina' || cliente.franquia.tipo == 'ilimitado') {
    cliente.franquia.valor = 0
  } else {
    cliente.franquia.valor = leitura.querySelector('#franquiaValor').value.replace(/ págs/g , '')
  }

  cliente.franquia.preco = Number(leitura.querySelector('#excedenteValor').value.replace(/,/g, '.'))

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

    impressora.setor = el.querySelector('#setor').value

    if(el.querySelector('#capacidade').value == 'ilimitado') {
      impressora.tinta.capacidade = el.querySelector('#capacidade').value
    } else {
      impressora.tinta.capacidade = Number(el.querySelector('#capacidade').value)
    }

    if(cliente.franquia.tipo == 'maquina') {
      impressora.franquia = parseInt(el.querySelector('#franquia').value.replace(/ págs/g , ''))
    } else {
      impressora.franquia = 0
    }
  })

  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.post('https://us-central1-ioi-printers.cloudfunctions.net/gravarCliente', {
    usuario: usuario.usuario,
    senha: usuario.senha,
    cliente: JSON.stringify(cliente)
  }).then(res => {
    feedbacks--
    if(res.data.autenticado) {
      if(res.data.erro) {
        error(res.data.msg)
      } else {
        feedback(false)
        if(tela == 'leituras') {
          preparLeiturasParaListagem(cliente)
    
          var filtros = document.getElementById('filtrosDeLeituras')
          var filtroSelecionado = filtros.options[filtros.selectedIndex].value
          var novaListagem
          if(filtroSelecionado == 'excluidas') {
            novaListagem = criarInterfaceLeitura(cliente, false)
          } else {
            novaListagem = criarInterfaceLeitura(cliente, true)
          }
          setTimeout(() => {
            if(parseInt(novaListagem.querySelector('#impressoras').innerHTML) > 0) {
              esconderLoad()
              document.getElementById('listagem').replaceChild(novaListagem, document.getElementById(cliente.id))
            } else {
              var el = document.getElementById(cliente.id)
              el.style.opacity = '0'
              setTimeout(() => {
                el.remove()
              }, 250)
            }
          }, 100)
        }
      }
    } else {
      error('Tivemos algum problema com a autenticação. Recarregue a página e tente novamente!')
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error('Erro ao gravar os dados. Recarregue a página e tente novamente!')
  })
  fecharLeitura()
}

const gerarRelatorio = cliente => {

  var meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  var dataParaListagem = document.getElementById('datasDeLeiturasExpandida')
  var dataInvertida = dataParaListagem.options[dataParaListagem.selectedIndex].value
  var dataSplit = dataInvertida.split('-')
  feedbacks++
  feedback(true)
  var doc = dadosDoRelatorio(cliente, dataParaListagem)
  feedbacks--
  feedback(false)
  doc.save(cliente.nomefantasia + ' - ' + meses[parseInt(dataSplit[1])] + '_' + dataSplit[0] + '.pdf')
}

const dadosDoRelatorio = (cliente, el) => {

  var meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  var dataParaListagem = el
  var dataInvertida = dataParaListagem.options[dataParaListagem.selectedIndex].value
  var dataSplit = dataInvertida.split('-')
  var dataDeListagem = meses[parseInt(dataSplit[1])] + '/' + dataSplit[0]

  var doc = new jsPDF('p', 'mm', [297, 210])
  doc.addImage(pdfLogo, 'PNG', 25, 10, 150, 35)
  doc.setFontSize(16)

  //centra o texto na tela
  var textWidth = doc.getStringUnitWidth(cliente.nomefantasia) * doc.internal.getFontSize() / doc.internal.scaleFactor
  var textOffset = (210 - textWidth) / 2
  doc.text(textOffset, 53, cliente.nomefantasia)
  var line = 60

  doc.setFontSize(14)
  var msg = 'Relatorio de páginas impressas - Mês de referência: ' + dataDeListagem
  textWidth = doc.getStringUnitWidth(msg) * doc.internal.getFontSize() / doc.internal.scaleFactor
  textOffset = (210 - textWidth) / 2
  doc.text(textOffset, line, msg)
  line = incrementLine(doc, line, 9)

  if(cliente.franquia.tipo == 'maquina') {

    var impressoras = cliente.impressoras
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]

      if(impressora.ativa) {
        doc.setFontSize(12)
        doc.text(20, line, impressora.modelo + ' - ' + impressora.serial)
        line = incrementLine(doc, line, 5)
        doc.text(20, line, 'Setor: ' + impressora.setor + ' - IP: ' + impressora.ip)
        line = incrementLine(doc, line, 5)
        doc.text(20, line, 'Impressões contabilizadas: ' + impressora.impresso + ' páginas')
        line = incrementLine(doc, line, 5)

        if(impressora.leituras[dataInvertida] != undefined) {
          var inicial = impressora.leituras[dataInvertida].inicial.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].inicial.valor + ' páginas'
          var final = impressora.leituras[dataInvertida].final.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].final.valor + ' páginas'
          doc.text(20, line, 'Contador inicial: ' + inicial)
          line = incrementLine(doc, line, 5)
          doc.text(20, line, 'Contador final: ' + final)
        } else {
          doc.text(20, line, 'Contador inicial: Sem Registro - Contador final: Sem Registro')
        }
        line = incrementLine(doc, line, 5)

        doc.text(20, line, 'Franquia contratada: ' + impressora.franquia + ' páginas' + ' - Excedentes: ' + impressora.excedentes + ' páginas')
        line = incrementLine(doc, line, 8)
      }
    }
  } else {

    if(cliente.franquia.tipo == 'pagina'){

      doc.text(20, line, 'Franquia contratada: ' + cliente.franquia + ' páginas - Impressões contabilizadas: ' + cliente.impresso + ' páginas')
      line = incrementLine(doc, line, 5)
      doc.text(20, line, 'Páginas excedentes: ' + cliente.excedentes + ' páginas')
      line = incrementLine(doc, line, 10)

    } else {
      doc.text(20, line, 'Franquia contratada: Ilimitada - Impressões contabilizadas: ' + cliente.impresso + ' páginas')
      line = incrementLine(doc, line, 10)
    }

    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]

      if(impressora.ativa) {
        doc.setFontSize(12)
        doc.text(20, line, impressora.modelo + ' - ' + impressora.serial)
        line = incrementLine(doc, line, 5)
        doc.text(20, line, 'Setor: ' + impressora.setor + ' - IP: ' + impressora.ip)
        line = incrementLine(doc, line, 5)

        if(impressora.leituras[dataInvertida] != undefined) {
          var inicial = impressora.leituras[dataInvertida].inicial.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].inicial.valor + ' páginas'
          var final = impressora.leituras[dataInvertida].final.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].final.valor + ' páginas'
          doc.text(20, line, 'Contador inicial: ' + inicial)
          line = incrementLine(doc, line, 5)
          doc.text(20, line, 'Contador final: ' + final)
        } else {
          doc.text(20, line, 'Contador inicial: Sem Registro - Contador final: Sem Registro')
        }
        line = incrementLine(doc, line, 5)
        doc.text(20, line, 'Total impresso: ' + impressora.impresso + ' páginas')
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

  var meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  var dataParaListagem = document.getElementById('datasDeLeituras')
  var dataInvertida = dataParaListagem.options[dataParaListagem.selectedIndex].value
  var dataSplit = dataInvertida.split('-')
  var dataDeListagem = meses[parseInt(dataSplit[1])] + '/' + dataSplit[0]
  var zip = new JSZip()

  var relatorioSelect = document.getElementById('relatorioFiltro').value
  var doc = new jsPDF('p', 'mm', [297, 210])
  var line = 30
  
  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]
    if(cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0){
      if(relatorioSelect == 'todos') {
        salvar = true
        doc = dadosDoRelatorio(cliente, dataParaListagem)
        zip.file(cliente.nomefantasia + ' - ' + dataSplit[1] + '_' + dataSplit[0] + '.pdf', doc.output('blob'))

      } else if(relatorioSelect == 'interno' && (cliente.excedentes > 0 || cliente.franquia.tipo == 'ilimitado')) {

        var valor = cliente.franquia.preco.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
        salvar = true
        doc.setFontSize(14)
        textWidth = doc.getStringUnitWidth(cliente.nomefantasia) * doc.internal.getFontSize() / doc.internal.scaleFactor
        textOffset = (210 - textWidth) / 2
        doc.text(textOffset, line, cliente.nomefantasia)
        line = incrementLine(doc, line, 9)
        doc.setFontSize(12)

        if(cliente.franquia.tipo == 'maquina'){

          var valorTotal = (cliente.franquia.preco * cliente.excedentes).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
          doc.text(20, line, 'Valor por excedente: ' + valor + ' - Excedentes: ' + cliente.excedentes + ' páginas - Valor excedentes: ' + valorTotal)
          line = incrementLine(doc, line, 9)

          var impressoras = cliente.impressoras
          for(var x = 0; x < Object.keys(impressoras).length; x++) {
            var impressora = impressoras[Object.keys(impressoras)[x]]
            if(impressora.ativa) {
              doc.text(20, line, impressora.modelo + ' - ' + impressora.serial)
              line = incrementLine(doc, line, 5)
              doc.text(20, line, 'Setor: ' + impressora.setor + ' - IP: ' + impressora.ip)
              line = incrementLine(doc, line, 5)
              doc.text(20, line, 'Impressões contabilizadas: ' + impressora.impresso + ' páginas')
              line = incrementLine(doc, line, 5)

              if(impressora.leituras[dataInvertida] != undefined) {
                var inicial = impressora.leituras[dataInvertida].inicial.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].inicial.valor + ' páginas'
                var final = impressora.leituras[dataInvertida].final.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].final.valor + ' páginas'
                doc.text(20, line, 'Contador inicial: ' + inicial)
                line = incrementLine(doc, line, 5)
                doc.text(20, line, 'Contador final: ' + final)
              } else {
                doc.text(20, line, 'Contador inicial: Sem Registro - Contador final: Sem Registro')
              }
              line = incrementLine(doc, line, 5)

              doc.text(20, line, 'Franquia contratada: ' + impressora.franquia + ' páginas' + ' - Excedentes: ' + impressora.excedentes + ' páginas')
              line = incrementLine(doc, line, 8)
            }
          }
        } else {
          if(cliente.franquia.tipo == 'pagina'){
            doc.text(20, line, 'Franquia contratada: ' + cliente.franquia.valor + ' páginas - Impressões contabilizadas: ' + cliente.impresso + ' páginas')
            line = incrementLine(doc, line, 5)
            var valorTotal = (cliente.franquia.preco * cliente.excedentes).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
            doc.text(20, line, 'Valor por excedente: ' + valor + ' - Excedentes: ' + cliente.excedentes + ' páginas - Valor excedentes: ' + valorTotal)
            line = incrementLine(doc, line, 10)

          } else {
            doc.text(20, line, 'Franquia contratada: Ilimitada - Impressões contabilizadas: ' + cliente.impresso + ' páginas')
            line = incrementLine(doc, line, 5)
            var valorTotal = (cliente.franquia.preco * cliente.impresso).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
            doc.text(20, line, 'Valor por página: ' + valor + ' - Valor total: ' + valorTotal)
            line = incrementLine(doc, line, 10)
          }

          var impressoras = cliente.impressoras
          for(var x = 0; x < Object.keys(impressoras).length; x++) {
            var impressora = impressoras[Object.keys(impressoras)[x]]
            if(impressora.ativa) {
              doc.text(20, line, impressora.modelo + ' - ' + impressora.serial)
              line = incrementLine(doc, line, 5)
              doc.text(20, line, 'Setor: ' + impressora.setor + ' - IP: ' + impressora.ip)
              line = incrementLine(doc, line, 5)

              if(impressora.leituras[dataInvertida] != undefined) {
                var inicial = impressora.leituras[dataInvertida].inicial.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].inicial.valor + ' páginas'
                var final = impressora.leituras[dataInvertida].final.dia + '/' + dataDeListagem + ' - ' + impressora.leituras[dataInvertida].final.valor + ' páginas'
                doc.text(20, line, 'Contador inicial: ' + inicial)
                line = incrementLine(doc, line, 5)
                doc.text(20, line, 'Contador final: ' + final)
              } else {
                doc.text(20, line, 'Contador inicial: Sem Registro - Contador final: Sem Registro')
              }
              line = incrementLine(doc, line, 5)
              doc.text(20, line, 'Total impresso: ' + impressora.impresso + ' páginas')
              line = incrementLine(doc, line, 8)
            }
          }
        }
        var separador = '------------------------------------------------------------------------------------------------------------------------'
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
    if(relatorioSelect == 'todos') {
      zip.generateAsync({type:'blob'}).then(blob =>  {
        saveAs(blob, meses[parseInt(dataSplit[1])] + '_' + dataSplit[0] + '.zip')
      })
    } else if(relatorioSelect == 'interno') {
      doc.save('interno - ' + meses[parseInt(dataSplit[1])] + '_' + dataSplit[0] + '.pdf')
    }
  } else {
    error('Clientes sem excedentes para gerar o relatório!')
  }
}

/*
*
* funções sobre os clientes
*
*/
const selecionarClientes = () => {
  if(tela != 'clientes') {
    tela = 'clientes'
    document.getElementById('listagem').innerHTML = ''
    listagem(false)
  }
}

const listagemClientes = () => {
  var container = document.getElementById('tPessoasContainer').content.cloneNode(true)
  var ativos = new DocumentFragment()
  var inativos = new DocumentFragment()
  var fornecedores = new DocumentFragment()

  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]
    var interface = document.getElementById('tCliente').content.cloneNode(true)

    interface.querySelector('#expandir').onclick = ((cliente) => {
      return () => {expandirCliente(cliente)}
    })(cliente)

    interface.querySelector('#excluir').onclick = ((cliente) => {
      return () => {excluirCliente(cliente)}
    })(cliente)

    interface.querySelector('.cliente').id = cliente.id
    interface.querySelector('#nome').innerHTML = cliente.nomefantasia
    interface.querySelector('#chave').innerHTML = 'Chave: ' + cliente.id

    if(!cliente.ativo) {
      interface.querySelector('#excluir').className = 'fas fa-user-unlock green'
      inativos.appendChild(interface)
    } else {
      if(cliente.fornecedor) {
        fornecedores.appendChild(interface)
      } else {
        ativos.appendChild(interface)
      }
    }
  }
  container.querySelector('#ativos').appendChild(ativos)
  container.querySelector('#inativos').appendChild(inativos)
  container.querySelector('#fornecedores').appendChild(fornecedores)
  document.getElementById('listagem').appendChild(container)
}

const expandirCliente = cliente => {
  var layout = document.getElementById('tClienteExpandido').content.cloneNode(true)
  layout.querySelector('#salvar').onclick = () => {salvarCliente(cliente)}
  layout.querySelector('#printers').onclick = () => {
    if(cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0) {
      fecharCliente()
      selecionarLeituras()
      setTimeout(() => {
        expandirLeitura(cliente)
      }, 350)
    } else {
      error('Cliente não tem nenhuma impressora para listar!')
    }
  }

  if(cliente != undefined) {
    layout.querySelector('clienteExpandido').id = cliente.id
    preencherCliente(cliente, layout)
    if(cliente.fornecedor) {
      layout.querySelector('#nome').innerHTML = 'Editar Fornecedor'
    } else {
      layout.querySelector('#nome').innerHTML = 'Editar Cliente'
    }
  } else {
    layout.querySelector('#nome').innerHTML = 'Cadastrar Pessoa'
    layout.querySelector('.tipo').style.display = 'block'
  }
  if(tela != 'leituras' && cliente != undefined && cliente.ativo) {
    layout.querySelector('#printers').style.display = 'block'
  }
  document.body.appendChild(layout)

  $('#celular').mask('(00) 00000-0000')
	$('#telefone').mask('(00) 0000-0000')
	$('#cep').mask('00000-000')
  $('#numero').mask('0000000')
  $('#estado').mask('AA')
  $('.hora').mask('00:00')

  var options = {
    onKeyPress: (cpf, ev, el, op) => {
      var masks = ['000.000.000-000', '00.000.000/0000-00']
      $('#cpfcnpj').mask((cpf.length > 14) ? masks[1] : masks[0], op)
    }
  }
  $('#cpfcnpj').length > 11 ? $('#cpfcnpj').mask('00.000.000/0000-00', options) : $('#cpfcnpj').mask('000.000.000-00#', options)

  setTimeout(() => {
    document.getElementById('clienteExpandido').style.opacity = '1'
  }, 50)
}

const excluirCliente = cliente => {

  if(cliente.ativo) {
    if(confirm('Deseja desativar o cliente? Isso NÂO vai excluir os dados!')) {
      
      var usuario = JSON.parse(localStorage.getItem('usuario'))
      if(usuario.permissao.excluir) {
        cliente.ativo = false
        gravarCliente(cliente)
      } else {
        error('Usuário sem permissão para fazer isso!')
      }
    }
  } else {
    if(confirm('Deseja reativar o cliente?')) {
      cliente.ativo = true
      gravarCliente(cliente)
    }
  }
}

const preencherCliente = (cliente, layout) => {

  layout.querySelector('#razaosocial').value = toTitleCase(cliente.razaosocial)
  layout.querySelector('#nomefantasia').value = toTitleCase(cliente.nomefantasia)
  layout.querySelector('#cpfcnpj').value = cliente.cpfcnpj
  layout.querySelector('#email').value = cliente.contato.email
  layout.querySelector('#telefone').value = cliente.contato.telefone
  layout.querySelector('#celular').value = cliente.contato.celular
  layout.querySelector('#endereco').value = toTitleCase(cliente.endereco.rua)
  layout.querySelector('#numero').value = cliente.endereco.numero
  layout.querySelector('#bairro').value = toTitleCase(cliente.endereco.bairro)
  layout.querySelector('#cidade').value = toTitleCase(cliente.endereco.cidade)
  layout.querySelector('#estado').value = cliente.endereco.estado
  layout.querySelector('#cep').value = cliente.endereco.cep
  layout.querySelector('#complemento').value = cliente.endereco.complemento

  var semana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  var horarios = cliente.horarios
  for(var x = 0; x < 7; x++) {
    if(horarios[semana[x]].aberto) {
      layout.querySelector('#' + semana[x]).checked = true
      mostrarHorarios(layout.querySelector('#' + semana[x]))
      var horario = horarios[semana[x]].horario
      layout.querySelector('#' + semana[x] + 'De1').value = horario[0].split(' - ')[0]
      layout.querySelector('#' + semana[x] + 'Ate1').value = horario[0].split(' - ')[1]
      layout.querySelector('#' + semana[x] + 'De2').value = horario[1].split(' - ')[0]
      layout.querySelector('#' + semana[x] + 'Ate2').value = horario[1].split(' - ')[1]
    }
  }
}

const salvarCliente = cliente => {

  var ok = true
  var layout = document.getElementById('clienteExpandido')

  if(layout.querySelector('#razaosocial').value == '') {
    ok = false
    layout.querySelector('#razaosocial').reportValidity()
  } else if(layout.querySelector('#nomefantasia').value == '') {
    ok = false
    layout.querySelector('#nomefantasia').reportValidity()
  } else if(layout.querySelector('#telefone').value == '') {
    if(layout.querySelector('#celular').value == ''){
      ok = false
      layout.querySelector('#telefone').reportValidity()
    }
  } else if(layout.querySelector('#endereco').value == '') {
    ok = false
    layout.querySelector('#endereco').reportValidity()
  } else if(layout.querySelector('#numero').value == '') {
    ok = false
    layout.querySelector('#numero').reportValidity()
  } else if(layout.querySelector('#cidade').value == '') {
    ok = false
    layout.querySelector('#cidade').reportValidity()
  } else if(layout.querySelector('#estado').value == '') {
    ok = false
    layout.querySelector('#estado').reportValidity()
  }

  if(ok) {
    if(cliente == undefined) {
      var data = new Date()
      cliente = new Object()
      cliente.contato = new Object()
      cliente.endereco = new Object()
      cliente.id = data.getTime() + ''
      cliente.ativo = true

      cliente.franquia = {
        tipo: 'ilimitado',
        valor: 0
      }
      cliente.fornecedor = false
      var tipo = layout.querySelector('#tipoCliente').value
      if(tipo == 'fornecedor') {
        cliente.fornecedor = true
      }
      cliente.sistema = {
        local: btoa('Não Instalado'),
        versao: 'Não Instalado'
      }
      clientes[cliente.id] = cliente
    }

    cliente.nomefantasia = toTitleCase(layout.querySelector('#nomefantasia').value)
    cliente.razaosocial = toTitleCase(layout.querySelector('#razaosocial').value)
    cliente.contato.telefone = layout.querySelector('#telefone').value
    cliente.contato.celular = layout.querySelector('#celular').value
    cliente.contato.email = layout.querySelector('#email').value.toLowerCase()
    cliente.cpfcnpj = layout.querySelector('#cpfcnpj').value

    cliente.endereco.rua = toTitleCase(layout.querySelector('#endereco').value)
    cliente.endereco.numero = layout.querySelector('#numero').value
    cliente.endereco.bairro = toTitleCase(layout.querySelector('#bairro').value)
    cliente.endereco.cidade = toTitleCase(layout.querySelector('#cidade').value)
    cliente.endereco.estado = layout.querySelector('#estado').value
    cliente.endereco.cep = layout.querySelector('#cep').value
    cliente.endereco.complemento = layout.querySelector('#complemento').value

    var semana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
    var horarios = new Object()
    for(var x = 0; x < 7; x++) {
      horarios[semana[x]] = new Object()
      if(layout.querySelector('#' + semana[x]).checked) {
        horarios[semana[x]].aberto = true
        horarios[semana[x]].horario = []
        var a = layout.querySelector('#' + semana[x] + 'De1').value + ' - ' + layout.querySelector('#' + semana[x] + 'Ate1').value
        var b = layout.querySelector('#' + semana[x] + 'De2').value + ' - ' + layout.querySelector('#' + semana[x] + 'Ate2').value
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

const gravarCliente = cliente => {

  //deleta os dados locais que não precisam serem salvos no DB
  delete cliente.excedentes
  delete cliente.impresso

  if(cliente.franquia.tipo == 'maquina' || cliente.franquia.tipo == 'ilimitado') {
    cliente.franquia.valor = 0
  }

  var impressoras = cliente.impressoras
  if(impressoras != undefined && Object.keys(impressoras).length > 0) {
    delete cliente.impressoras.atraso
    delete cliente.impressoras.inativas
    delete cliente.abastecimento
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]
      //deleta os dados locais que não precisam serem salvos no DB
      delete impressora.excedentes
      delete impressora.impresso
      delete impressora.serial
      if(cliente.franquia.tipo != 'maquina') {
        impressora.franquia = 0
      }
    }
  }

  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.post('https://us-central1-ioi-printers.cloudfunctions.net/gravarCliente', {
    usuario: usuario.usuario,
    senha: usuario.senha,
    cliente: JSON.stringify(cliente)
  }).then(res => {
    feedbacks--
    if(res.data.autenticado) {
      if(res.data.erro) {
        error(res.data.msg)
      } else {
        feedback(false)
      }
    } else {
      error('Tivemos algum problema com a autenticação. Recarregue a página e tente novamente!')
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error('Erro ao gravar os dados. Alterações não foram salvas. Recarregue a página e tente novamente!')
  })
  //não espera a confirmação de gravação, o sistema atualiza mais rapido
  if(tela == 'clientes') {
    document.getElementById('listagem').innerHTML = ''
    listagem(false)
  }
}

const toTitleCase = str => {
  return str.toLowerCase().replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const fecharCliente = () => {
  var clienteExpandido = document.getElementById('clienteExpandido')
  clienteExpandido.style.opacity = '0'
  setTimeout(() => {
    clienteExpandido.remove()
  }, 250)
}

const mostrarHorarios = element => {
  var dia = element.id
  var layout = element.parentNode.parentNode

  if(element.checked) {
    layout.querySelector('.horarios').style.height = '48px'
    layout.querySelector('.horarios').style.opacity = '1'
  } else {
    layout.querySelector('.horarios').style.height = '0px'
    layout.querySelector('.horarios').style.opacity = '0'
  }
}

/*
*
* funções dos atendimentos
*
*/
//limpa tudo, cria os filtros e lista de atendimentos do zero
const selecionarAtendimentos = () => {
  if(tela != 'atendimentos') {
    tela = 'atendimentos'
    document.getElementById('listagem').innerHTML = ''
    listagem(false)
  }
}

const listagemAtendimentos = () => {
  var atFeitos = {}
  var atAberto = {}
  for(var x = 0; x < Object.keys(usuarios).length; x++) {
    var usuario = usuarios[Object.keys(usuarios)[x]]
    usuario.atendimentos = {}
  }
 
  for(var x = 0; x < Object.keys(atendimentos).length; x++) {
    var atendimento = atendimentos[Object.keys(atendimentos)[x]]
    
    if(clientes[atendimento.cliente] != undefined) {
      atendimento.dados = clientes[atendimento.cliente]

      if(atendimento.feito) {
        atFeitos[atendimento.id] = atendimento
  
      } else if(atendimento.responsavel == '') {
        atAberto[atendimento.id] = atendimento
  
      } else {
        for(var y = 0; y < Object.keys(usuarios).length; y++) {
          var usuario = usuarios[Object.keys(usuarios)[y]]
      
          if(atendimento.responsavel == usuario.nome) {
            atendimento.tecnico = usuario
            usuario.atendimentos[atendimento.id] = atendimento
          }
        }
      }
    } 
  }
  
  var container = document.getElementById('tAtendimentosContainer').content.cloneNode(true)

  for(var y = 0; y < Object.keys(atAberto).length; y++) {
    var atendimento = atAberto[Object.keys(atAberto)[y]]

    container.querySelector('#abertos').appendChild(criarInterfaceAtendimento(atendimento))
  }
 
  for(var x = 0; x < Object.keys(usuarios).length; x++) {
    var usuario = usuarios[Object.keys(usuarios)[x]]
    var ordered = {}

    Object.keys(usuario.atendimentos).sort((a, b) => {
      return usuario.atendimentos[a].ordem - usuario.atendimentos[b].ordem
    }).forEach(key => {
      ordered[key] = usuario.atendimentos[key]
    })
    usuario.atendimentos = ordered

    for(var y = 0; y < Object.keys(usuario.atendimentos).length; y++) {
      var atendimento = usuario.atendimentos[Object.keys(usuario.atendimentos)[y]]

      if(container.querySelector('#' + usuario.usuario) == null) {
        var layout = document.createElement('pessoasContainer')
        layout.innerHTML = "<div class='pessoasTitulo ordem'>" + usuario.nome + 
                        "</div><div class='pessoasListagem tec' id='" + usuario.usuario + "'></div>"
  
        container.querySelector('.pessoasContainer').appendChild(layout)
        Sortable.create(container.querySelector('#' + usuario.usuario), {animation: 250})
      }
      container.querySelector('#' + usuario.usuario).appendChild(criarInterfaceAtendimento(atendimento))
    }
  }
 
  var feitos = document.createElement('pessoasContainer')
  feitos.innerHTML = "<div class='pessoasTitulo'><span>Feitos</span><i class='fas fa-sort-down flipflop' onclick='expandirFeitos()' title='Expandir'></i></div><div class='pessoasListagem' id='feitos'></div>"

  for(var y = 0; y < Object.keys(atFeitos).length; y++) {
    var atendimento = atFeitos[Object.keys(atFeitos)[y]]   

    feitos.querySelector('#feitos').appendChild(criarInterfaceAtendimento(atendimento))
  }

  container.querySelector('.pessoasContainer').appendChild(feitos)
  document.getElementById('listagem').appendChild(container)
}

const criarInterfaceAtendimento = atendimento => {
  var interface = document.getElementById('tAtendimento').content.cloneNode(true)
  interface.querySelector('atendimento').id = atendimento.id
  
  if(atendimento.feito){
    interface.querySelector('#concluido').className = 'fas fa-file-times red'
  }

  interface.querySelector('#expandir').onclick = (atendimento => {
    return () => {expandirAtendimento(atendimento)}
  })(atendimento)

  interface.querySelector('#concluido').onclick = (atendimento => {
    return () => {
      if(atendimento.feito) {
        atendimento.feito = false
        atendimento.datas = {
          inicio: atendimento.datas.inicio,
          fim: ''
        }
      } else {

        var data = new Date()
        var ano = data.getFullYear()
        var mes = data.getMonth() + 1
        if (mes < 10) { mes = "0" + mes }
        var dia = data.getDate()
        if (dia < 10) { dia = "0" + dia }

        atendimento.feito = true
        atendimento.datas = {
          inicio: atendimento.datas.inicio,
          fim: ano + '-' + mes + '-' + dia
        }
      }
      atendimentos[atendimento.id] = atendimento

      delete atendimento.dados
      delete atendimento.tecnico
      gravarAtendimentos({[atendimento.id]: atendimento})
    }
  })(atendimento)

  if(atendimento.feito) {
    var data = atendimento.datas.fim.split('-')
    interface.querySelector('#data').innerHTML = '<span>Feito em</span>' + data[2] + '/' + data[1] + '/' + data[0]
  } else {
    var data = atendimento.datas.inicio.split('-')
    interface.querySelector('#data').innerHTML = '<span>Início</span>' + data[2] + '/' + data[1] + '/' + data[0]
  }

  interface.querySelector('#cliente').innerHTML = '<span>Cliente</span>' + atendimento.dados.nomefantasia
  interface.querySelector('#cidade').innerHTML = '<span>Cidade</span>' + atendimento.dados.endereco.cidade
  
  var motivo = ''
  atendimento.motivo.forEach((el, index) => {
    if(index < atendimento.motivo.length - 1) {
      motivo = motivo + el + ' - '
    } else {
      motivo = motivo + el
    }
  })
  interface.querySelector('#motivo').innerHTML = '<span>Motivo</span>' + motivo

  //determina se o sistema já pode gravar a ordem dos atendimentos ou se o usuario continua editando
  var timeout
  //quando começar o drag'n'drop limpa o timeout e espera o timeout para tentar gravar
  interface.querySelector('atendimento').ondragstart = (timeout => {
    return () => {clearTimeout(timeout)}
  })(timeout)

  interface.querySelector('atendimento').ondragend = (timeout => {
    return () => {
      if(!atendimento.feito) {
        timeout = setTimeout(() => {
          if(tela == 'atendimentos') {
            salvarOrdemAtendimentos(atendimento.tecnico)
          } else {
            feedbacks--
            error('As alterações na ordem dos atendimentos foram perdidas por mudança de tela. Tente novamente!')
          }
        }, 4000)
      }
    }
  })(timeout)

  return interface
}

const salvarOrdemAtendimentos = responsavel => {

  var container = document.body.querySelector('#' + responsavel.usuario).children
  if(container.length > 1) {

    for(var x = 0; x < container.length; x++) {
      var el = container[x]
  
      var atendimento = responsavel.atendimentos[el.id]
      atendimento.ordem = x + 1

      delete atendimento.dados
      delete atendimento.tecnico
    }
    gravarAtendimentos(responsavel.atendimentos)
  }
}

const gravarAtendimentos = atendimento => {
  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarAtendimentos', {
    params: {
      usuario: usuario.usuario,
      senha: usuario.senha,
      atendimentos: JSON.stringify(atendimento)
    }
  }).then(res => {
    feedbacks--
    if(res.data.autenticado) {
      if(res.data.erro) {
        error(res.data.msg)
      } else {
        feedback(false)
      }
    } else {
      error('Tivemos algum problema com a autenticação. Recarregue a página e tente novamente!')
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error('Erro ao gravar os dados. Alterações não foram salvas. Recarregue a página e tente novamente!')
  })

  // a atualização da página tem que ser mais rapida nos atendimentos
  // por isso não espera a confirmação da gravação para atualizar a listagem
  if(tela == 'atendimentos') {
    document.getElementById('listagem').innerHTML = ''
    setTimeout(() => {
      listagem(false)
    }, 300)
  }
}

const expandirAtendimento = atendimento => {

  var layout = document.getElementById('tAtendimentoExpandido').content.cloneNode(true)
  layout.querySelector('#salvar').onclick = () => {salvarAtendimento(atendimento)}

  var nomes = layout.querySelector('#cliente')
  autoCompleteClientes(nomes)

  var tecnicos = layout.querySelector('#responsavel')
  for(var x = 0; x < Object.keys(usuarios).length; x++) {
    var usuario = usuarios[Object.keys(usuarios)[x]]

    var option = document.createElement('option')
    option.value = usuario.nome
    option.innerHTML = usuario.nome
    tecnicos.appendChild(option)
  }

  var adicionarMotivo = document.getElementById('tAtendimentoAdicionar').content.cloneNode(true)
  if(atendimento != undefined) {
    layout.querySelector('#nome').innerHTML = 'Editar Atendimento'
    layout.querySelector('atendimentoExpandido').id = atendimento.id

    preencherAtendimento(atendimento, layout)
  } else {

    layout.querySelector('#nome').innerHTML = 'Novo Atendimento'
    var motivo = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)
    autoCompleteMotivos(motivo.querySelector('.motivo-texto'))
    layout.querySelector('.motivo-list').appendChild(motivo)
  }

  layout.querySelector('.motivo-list').appendChild(adicionarMotivo)

  document.body.appendChild(layout)
  setTimeout(() => {
    document.getElementById('atendimentoExpandido').style.opacity = '1'
  }, 50)
}

const fecharAtendimento = () => {
  var atendimentoExpandido = document.getElementById('atendimentoExpandido')
  atendimentoExpandido.style.opacity = '0'
    setTimeout(() => {
      atendimentoExpandido.remove()
    }, 200)
}

const expandirFeitos = () => {
  var feitos = document.getElementById('feitos')
  var shown = false

  if(feitos.style.display == 'block') {
    shown = true
    feitos.style.maxHeight = '0px'
    feitos.style.opacity = '0'
    setTimeout(() => {
      feitos.style.display = 'none'
    }, 200)
  } else {
    shown = false
    feitos.style.display = 'block'
    setTimeout(() => {
      feitos.style.opacity = '1'
      feitos.style.maxHeight = '188px'
    }, 10)
  }

  setTimeout(() => {
    if(!shown) {
      document.querySelector('.flipflop').style.transform = "rotate(180deg)"
    } else {
      document.querySelector('.flipflop').style.transform = "rotate(0deg)"
    }
  }, 10)
}

/*
* funções dos autocompletes
*/
const autoCompleteClientes = input => {
  /* precisa de dois parâmetros: o input de textos e o array de clientes */
	var currentFocus
	/* adiciona um listener quando for digitado alguma coisa */
	input.addEventListener('input', function(e) {
  
    var a, b, i, val = this.value
    closeAllLists()
    
	  if (!val) { return false }
    currentFocus = -1

	  a = document.createElement('DIV')
	  a.setAttribute('id', this.id + 'autocomplete-list')
	  a.setAttribute('class', 'autocomplete')
    this.parentNode.appendChild(a)
    
    for(var x = 0; x < Object.keys(clientes).length; x++) {
      var cliente = clientes[Object.keys(clientes)[x]]
      
      val = val.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '')

      /* checa as letras compativeis no nome fantasia */
      if (cliente.nomefantasia.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val ) > -1 
          || cliente.razaosocial.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val ) > -1) {
        
        /* cria uma div para cada item que tenha correspondencia */
        b = document.createElement('DIV')
        if (cliente.nomefantasia.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val ) > -1) {
          b.innerHTML = cliente.nomefantasia
        } else if (cliente.razaosocial.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val ) > -1) {
          b.innerHTML = cliente.razaosocial
        }

        /* cria um input invisivel que vai segurar o valor do item */
        b.innerHTML += "<input type='hidden' value='" + cliente.id + "'>"
        /* executa a função quando for clicado na div do item */
        b.addEventListener('click', function(e) {
          //quando clicar em um item do autocomplete, define o valor
          input.value = clientes[this.getElementsByTagName('input')[0].value].nomefantasia
          mostrarDadosCliente(clientes[this.getElementsByTagName('input')[0].value], input)
          closeAllLists()
        })
        a.appendChild(b)
      }
	  }
  })
  
  const closeAllLists = elmnt => {
    /* fecha todas as listas do documento, exceto a passada como argumento */
    var x = document.querySelectorAll('.autocomplete')
    x.forEach(el => {
      if (elmnt != el && elmnt != input) {
        el.parentNode.removeChild(el)
      }
    })
  }
    
	/* executa a função quando alguem clicar fora da lista */
	document.addEventListener('click', e => {
	  closeAllLists(e.target)
	})
}

const autoCompleteMotivos = input => {
  /* precisa de dois parâmetros: o input de textos e o array de clientes */
	var currentFocus
	/* adiciona um listener quando for digitado alguma coisa */
	input.addEventListener('input', function(e) {
  
    var a, b, i, val = this.value
    closeAllLists()
    
	  if (!val) { return false }
    currentFocus = -1

	  a = document.createElement('DIV')
	  a.setAttribute('id', this.id + 'autocomplete-list')
	  a.setAttribute('class', 'autocomplete')
    this.parentNode.appendChild(a)
    
    for(var x = 0; x < Object.keys(suprimentos).length; x++) {
      var suprimento = suprimentos[Object.keys(suprimentos)[x]]

      /* checa as letras compativeis no nome fantasia */
      if (suprimento.modelo.toLowerCase().indexOf( val.toLowerCase() ) > -1) {
        /* cria uma div para cada item que tenha correspondencia */
        b = document.createElement('DIV')
        b.innerHTML = suprimento.modelo + ' - Em estoque: ' + suprimento.quantidade + ' unidades'
        /* cria um input invisivel que vai segurar o valor do item */
        b.innerHTML += "<input type='hidden' value='" + suprimento.id + "'>"
        /* executa a função quando for clicado na div do item */
        b.addEventListener('click', function(e) {
          //quando clicar em um item do autocomplete, define o valor
          input.value = suprimentos[this.getElementsByTagName('input')[0].value].modelo
          mostrarQuantidades(input, suprimentos[this.getElementsByTagName('input')[0].value], true)
          closeAllLists()
        })
        a.appendChild(b)
      }
	  }
  })
  
  const closeAllLists = elmnt => {
    /* fecha todas as listas do documento, exceto a passada como argumento */
      
    var x = document.querySelectorAll('.autocomplete')
    x.forEach(el => {
      if (elmnt != el && elmnt != input) {
        el.parentNode.removeChild(el)
      }
    })
  }

	/* executa a função quando alguem clicar fora da lista */
	document.addEventListener('click', e => {
	  closeAllLists(e.target)
	})
}
/*
* fim das funções dos autocompletes
*/

const preencherAtendimento = (atendimento, layout) => {

  layout.querySelector('#cliente').value = clientes[atendimento.cliente].nomefantasia
  mostrarDadosCliente(clientes[atendimento.cliente], layout.querySelector('#cliente'))

  var responsavel = layout.querySelector('#responsavel')
  for(var x = 0; x < responsavel.length; x++){
    if(atendimento.responsavel == responsavel.options[x].value) {
      responsavel.options[x].selected = true
    }
  }

  var status = layout.querySelector('#status')
  if(atendimento.feito){
    status.options[1].selected = true
  } else {
    status.options[0].selected = true
  }

  $('.motivo-quantidade').mask('000')
  atendimento.motivo.forEach(motivo => {
    var el = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)

    if(motivo.indexOf('Quantidade:') > 0) {
      
      var modelo = motivo.split(' - Quantidade: ')[0]
      var quantidade = parseInt(motivo.split(' - Quantidade: ')[1])
      var suprimento = suprimentoPorModelo(modelo)

      el.querySelector('.motivo-texto').value = modelo
      el.querySelector('.motivo-texto').onclick = element => {element.path[0].blur()}
      el.querySelector('.motivo-quantidade').value = quantidade
      el.querySelector('.motivo-quantidade').onclick = element => {element.path[0].blur()}
      mostrarQuantidades(el.querySelector('.motivo-texto'), suprimento, false)
    } else {
      el.querySelector('.motivo-texto').value = motivo
    }

    autoCompleteMotivos(el.querySelector('.motivo-texto'))
    layout.querySelector('.motivo-list').appendChild(el)
  })
}

const suprimentoPorModelo = modelo => {
  for(var x = 0; x < Object.keys(suprimentos).length; x++) {
    var suprimento = suprimentos[Object.keys(suprimentos)[x]]

    if(suprimento.modelo == modelo) {
      return suprimento
    }
  }
}

const clientePorNome = nome => {
  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]

    if(cliente.nomefantasia == nome || cliente.razaosocial == nome) {
      return cliente
    }
  }
}

const mostrarQuantidades = (el, suprimento, alterarQuantidade) => {
  var container = el.parentNode.parentNode
  var quantidade = container.querySelector('.quantidade')
  quantidade.style.width = '100px'
  quantidade.style.marginLeft = '8px'
  quantidade.style.marginRight = '8px'
  quantidade.style.opacity = '1'
  
  var input = quantidade.querySelector('.motivo-quantidade')
  if(parseInt(input.value) > parseInt(suprimento.quantidade) && alterarQuantidade) {
    input.value = suprimento.quantidade
  }

  if(suprimento.quantidade == 0) {
    input.value = 0
  }
}

const adicionarMotivo = el => {
  var motivo = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)
  var container = motivo.querySelector('.motivo')
  autoCompleteMotivos(motivo.querySelector('.motivo-texto'))
  container.style.opacity = '0'
  $(motivo).insertBefore(el.parentNode)
  setTimeout(() => {
    container.style.opacity = '1'
  }, 50)
}

const mostrarDadosCliente = (cliente, input) => {

  var container = input.parentNode.parentNode.parentNode.parentNode
  var dados = container.querySelector('#dados')
  var editClient = container.querySelector('#editCliente')

  var endereco = cliente.endereco
  dados.querySelector('#endereco').href = 'http://maps.google.com/maps?q=' + endereco.rua + '+' + endereco.numero + '+' + endereco.cidade
  if(endereco.complemento == '') {
    dados.querySelector('#endereco').innerHTML = endereco.rua + ', ' + endereco.numero + ', ' + endereco.cidade + ', ' + endereco.estado
  } else {
    dados.querySelector('#endereco').innerHTML = endereco.rua + ', ' + endereco.numero + ' - ' + endereco.complemento + ' - ' + endereco.cidade + ', ' + endereco.estado
  }

  if(cliente.contato.telefone != '' && cliente.contato.celular != '') {
    dados.querySelector('#telefone').innerHTML = cliente.contato.telefone + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + cliente.contato.celular
  } else if(cliente.contato.telefone == '' && cliente.contato.celular != '') {
    dados.querySelector('#telefone').innerHTML = cliente.contato.celular
  } else if(cliente.contato.telefone != '' && cliente.contato.celular == ''){
    dados.querySelector('#telefone').innerHTML = cliente.contato.telefone
  }

  editClient.style.minWidth = '20px'
  editClient.style.maxWidth = '20px'
  editClient.style.maxHeight = '20px'
  editClient.style.opacity = '1'
  editClient.onclick = () => { 
    fecharAtendimento()
    setTimeout(() => {
      expandirCliente(cliente)
    }, 50) 
  }

  dados.querySelector('#chave').innerHTML = 'Chave: ' + cliente.id + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Local inst.: ' + atob(cliente.sistema.local) + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Versão: ' + cliente.sistema.versao
    
  dados.style.height = 'fit-content'
  dados.style.opacity = '1'
}

const salvarAtendimento = atendimento => {
  var layout = document.body.querySelector('atendimentoExpandido')
  var cliente = clientePorNome(layout.querySelector('#cliente').value)
  var motivos = layout.querySelectorAll('.motivo-texto')
  var erro = false
  //só vai baixar do estoque se for um atendimento novo
  var editando = true
  var atualizarSuprimentos = false

  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if (mes < 10) { mes = "0" + mes }
  var dia = data.getDate()
  if (dia < 10) { dia = "0" + dia }

  if(atendimento == undefined) {
    editando = false
    atendimento = new Object()
    atendimento.id = data.getTime() + ''
    atendimento.datas = {
      inicio: ano + '-' + mes + '-' + dia,
      fim: ''
    }
    atendimento.ordem = 0
  }

  if(cliente == undefined) {
    error('Cliente inválido ou não cadastrado!')
    erro = true
  } else {
    atendimento.cliente = cliente.id
  }
  
  if(!erro) {
    for(var x = 0; x < Object.keys(atendimentos).length; x++) {
      var at = atendimentos[Object.keys(atendimentos)[x]]
      
      if((at.responsavel == '' || at.responsavel == layout.querySelector('#responsavel').value) 
        && at.cliente == atendimento.cliente && !at.feito && at.id != atendimento.id && !editando) {

        error('Já existe um atendimento em aberto para esse cliente!')
        erro = true
        break
      }
    }
  }
  
  if(!erro) {
    for(var x = 0; x < motivos.length; x++) {
      var motivo = motivos[x]
  
      if(motivo.value == '' && motivos.length < 2) {
        error('Motivo muito curto ou vazio!')
        erro = true
        break
      }
    }
  }

  if(!erro) {
    var motivoLocal = []
    
    for(var x = 0; x < motivos.length; x++) {
      var motivo = motivos[x]
      var suprimento = suprimentoPorModelo(motivo.value)

      if(suprimento != undefined) {
        atualizarSuprimentos = true
        //caso o motivo seja um toner ou suprimento
        var quantidade = parseInt(motivo.parentNode.parentNode.querySelector('.motivo-quantidade').value)
        if(quantidade > suprimento.quantidade) {
          error('A quantidade de toner não pode ser maior que a quantidade em estoque!')
          erro = true
          break
        } else {
          motivoLocal.push(suprimento.modelo + ' - Quantidade: ' + quantidade)
          if(!editando) { 
            suprimento.quantidade = suprimento.quantidade - quantidade 
            conferirQuantidadeSuprimento(suprimento)
          }
        }
      } else if(motivo.value != '') {
        motivoLocal.push(motivo.value)
      }
    }
    atendimento.motivo = motivoLocal

    atendimento.responsavel = layout.querySelector('#responsavel').value
    if(layout.querySelector('#status').value == "Feito") {
      atendimento.feito = true
      atendimento.datas = {
        inicio: atendimento.datas.inicio,
        fim: ano + '-' + mes + '-' + dia
      }
    } else {
      atendimento.feito = false
      atendimento.datas = {
        inicio: atendimento.datas.inicio,
        fim: ''
      }
    }

    if(!erro) {
      fecharAtendimento()
      atendimentos[atendimento.id] = atendimento
    
      delete atendimento.dados
      delete atendimento.tecnico
      if(atualizarSuprimentos) { gravarSuprimentos() }
      gravarAtendimentos({[atendimento.id]: atendimento})
    }
  }
}

/*
*
* funções sobre suprimentos
*
*/
const selecionarSuprimentos = () => {
  if(tela != 'suprimentos') {
      tela = 'suprimentos'
      document.getElementById('listagem').innerHTML = ''
      listagem(false)
    }
}

const listagemSuprimentos = () => {
  
  $('suprimento .qtd').mask('000')
  $('#valor input').mask('000,00', {reverse: true})
  var container = document.getElementById('tSurpimentosContainer').content.cloneNode(true)
  var holder = new DocumentFragment()

  for(var x = 0; x < Object.keys(suprimentos).length; x++) {
      var suprimento = suprimentos[Object.keys(suprimentos)[x]]
      var interface = document.getElementById('tSurpimento').content.cloneNode(true)

      if(suprimento.valor == undefined || suprimento.valor == null) {
        suprimento.valor = 0
      }

      if(suprimento.ideal == undefined || suprimento.ideal == null) {
        suprimento.ideal = 0
      }

      interface.querySelector('#salvar').onclick = (suprimento => {
          return () => {salvarSuprimento(suprimento)}
      })(suprimento)
      interface.querySelector('suprimento').id = suprimento.id
      interface.querySelector('#modelo').innerHTML = '<span>Modelo</span>' + toTitleCase(suprimento.modelo)
      interface.querySelector('#minimo').innerHTML = "<span>Quantidade Mínima</span><input onkeyup='conferirSuprimentos(this)' class='simpleInput qtd' type='text' value='" + suprimento.minimo + "'></div>"
      interface.querySelector('#quantidade').innerHTML = "<span>Quantidade Atual</span><input onkeyup='conferirSuprimentos(this)' class='simpleInput qtd' type='text' value='" + suprimento.quantidade + "'></div>"
      interface.querySelector('#ideal').innerHTML = "<span>Quantidade Ideal</span><input onkeyup='conferirSuprimentos(this)' class='simpleInput qtd' type='text' value='" + suprimento.ideal + "'></div>"
      interface.querySelector('#valor').innerHTML = "<span>Valor de venda</span><input onkeyup='conferirSuprimentos(this)' class='simpleInput' type='text' value='" + suprimento.valor.toFixed(2) + "'></div>"
      
      if(suprimento.minimo >= suprimento.quantidade) {
          interface.querySelector('suprimento').classList.add('acabando') 
          interface.querySelector('#modelo').classList.add('acabando')
          interface.querySelector('#minimo input').classList.add('acabando')
          interface.querySelector('#quantidade input').classList.add('acabando')
          interface.querySelector('#ideal input').classList.add('acabando')
          interface.querySelector('#valor input').classList.add('acabando')
      }
      holder.appendChild(interface)
  }
  container.querySelector('#suprimentos').appendChild(holder)
  document.getElementById('listagem').appendChild(container)
}

const adicionarSuprimento = () => {
  var suprimento = document.getElementById('tSurpimento').content.cloneNode(true)
  var container = suprimento.querySelector('suprimento')
  container.style.opacity = '0'

  suprimento.querySelector('#modelo').innerHTML = "<span>Modelo</span><input class='simpleInput' type='text' placeholder='Digite aqui'></div>"
  suprimento.querySelector('#quantidade').innerHTML = "<span>Quantidade Atual</span><input class='simpleInput qtd' type='text' value='0'></div>"
  suprimento.querySelector('#minimo').innerHTML = "<span>Quantidade Mínima</span><input class='simpleInput qtd' type='text' value='0'></div>"
  suprimento.querySelector('#ideal').innerHTML = "<span>Quantidade Ideal</span><input class='simpleInput qtd' type='text' value='0'></div>"
  suprimento.querySelector('#valor').innerHTML = "<span>Valor de venda</span><input class='simpleInput qtd' type='text' value='0,00'></div>"

  suprimento.querySelector('#salvar').className = 'fas fa-save'
  suprimento.querySelector('#salvar').onclick = (container => {
      return () => {

          var modelo = toTitleCase(container.querySelector('#modelo input').value)
          var minimo = parseInt(container.querySelector('#minimo input').value)
          var quantidade = parseInt(container.querySelector('#quantidade input').value)
          var ideal = parseInt(container.querySelector('#ideal input').value)
          var valor = parseInt(container.querySelector('#valor input').value)

          var suprimento = {
              id: new Date().getTime() + '',
              modelo: modelo,
              minimo: minimo,
              quantidade: quantidade,
              ideal: ideal,
              valor: Number(valor.replace(/,/g, '.'))
          }
          if(modelo == '') {
              error('Modelo não pode ficar em branco!')
          } else if(minimo <= 0) {
              error('Quantidade mínima igual a zero!')
          } else {
              container.id = suprimento.id
              salvarSuprimento(suprimento)
          }
      }
  })(suprimento.querySelector('#salvar').parentNode)

  document.getElementById('suprimentos').appendChild(suprimento)
  setTimeout(() => {
      container.style.opacity = '1'
      container.scrollIntoView(false)
  }, 50)
}

const salvarSuprimento = suprimento => {
  //se o suprimento já estiver na lista de suprimentos
  var layout = document.getElementById(suprimento.id)
  if(suprimentos[suprimento.id] != undefined) {
      
      var quantidade = parseInt(layout.querySelector('#quantidade input').value)
      var minimo = parseInt(layout.querySelector('#minimo input').value)
      var ideal = parseInt(layout.querySelector('#ideal input').value)
      var valor = Number(layout.querySelector('#valor input').value.replace(/,/g, '.'))

      if(suprimento.quantidade == quantidade && suprimento.minimo == minimo && suprimento.ideal == ideal && suprimento.valor == valor) {
          error('Nenhuma alteração para salvamento foi detectada')
      } else {
          suprimento.quantidade = quantidade
          suprimento.minimo = minimo
          suprimento.ideal = ideal
          suprimento.valor = valor

          if(suprimento.minimo < suprimento.quantidade) {
              layout.classList.remove('acabando')
              layout.querySelector('#modelo').classList.remove('acabando')
              layout.querySelector('#minimo input').classList.remove('acabando')
              layout.querySelector('#quantidade input').classList.remove('acabando')
          }

          layout.querySelector('#salvar').style.opacity = '0'
          setTimeout(() => {
              layout.querySelector('#salvar').className = 'fas fa-check'
              layout.querySelector('#salvar').style.opacity = '1'
          }, 100)
          gravarSuprimentos()
      }
  } else {
      layout.querySelector('#salvar').style.opacity = '0'
          setTimeout(() => {
              layout.querySelector('#salvar').className = 'fas fa-check'
              layout.querySelector('#salvar').style.opacity = '1'
          }, 100)
      suprimentos[suprimento.id] = suprimento
      gravarSuprimentos()
  }
}

const gravarSuprimentos = () => {
  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarSuprimentos', {
      params: {
          usuario: usuario.usuario,
          senha: usuario.senha,
          suprimentos: JSON.stringify(suprimentos)
      }
  }).then(res => {
      feedbacks--
      if(res.data.autenticado) {
          if(res.data.erro) {
              error(res.data.msg)
          } else {
              feedback(false)
          }
      } else {
          error('Tivemos algum problema com a autenticação. Recarregue a página e tente novamente!')
      }
  }).catch(err => {
      feedbacks--
      console.error(err)
      error('Erro ao gravar os dados. Alterações não foram salvas. Recarregue a página e tente novamente!')
  })
}

const conferirSuprimentos = el => {
  var layout = el.parentNode.parentNode
  var suprimento = suprimentos[layout.id]

  var minimo = parseInt(layout.querySelector('#minimo input').value)
  var quantidade = parseInt(layout.querySelector('#quantidade input').value)
  var ideal = parseInt(layout.querySelector('#ideal input').value)
  var valor = parseInt(layout.querySelector('#valor input').value)

  if((suprimento.quantidade != quantidade || suprimento.minimo != minimo 
      || suprimento.ideal != ideal || suprimento.valor != valor) && 
      !layout.querySelector('#salvar').classList.contains('fa-save')) {
      layout.querySelector('#salvar').style.opacity = '0'
      setTimeout(() => {
          layout.querySelector('#salvar').className = 'fas fa-save'
          layout.querySelector('#salvar').style.opacity = '1'
      }, 100)
  }
}

const conferirQuantidadeSuprimento = suprimento => {
  if(suprimento.quantidade <= suprimento.minimo) {
      error('É necessário pedir mais unidades de ' + suprimento.modelo + '<br> '  + suprimento.quantidade + ' unidades em estoque - Quantidade mínima: ' + suprimento.minimo + ' unidades.')
      
      if(tela == 'suprimentos') {
          var interface = document.getElementById(suprimento.id)
          interface.querySelector('suprimento').classList.add('acabando')
          interface.querySelector('#modelo').classList.add('acabando')
          interface.querySelector('#minimo input').classList.add('acabando')
          interface.querySelector('#quantidade input').classList.add('acabando')
      }
  }
}

const gerarPedidos = () => {
  feedbacks++
  feedback(true)

  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if (mes < 10) { mes = "0" + mes }
  var dia = data.getDate()
  if (dia < 10) { dia = "0" + dia }

  var doc = new jsPDF('p', 'mm', [297, 210])
  doc.addImage(pdfLogo, 'PNG', 25, 10, 150, 35)
  doc.setFontSize(16)
  //centra o texto na tela
  var titulo = 'Pedido de suprimentos - ' + dia + '/' + mes + '/' + ano
  var textWidth = doc.getStringUnitWidth(titulo) * doc.internal.getFontSize() / doc.internal.scaleFactor
  var textOffset = (210 - textWidth) / 2
  doc.text(textOffset, 53, titulo)
  var line = 60
  doc.setFontSize(12)
  for(var x = 0; x < Object.keys(suprimentos).length; x++) {
    var suprimento = suprimentos[Object.keys(suprimentos)[x]]
    if(suprimento.ideal > suprimento.quantidade) {
      doc.text(20, line, suprimento.modelo + ' - ' + (suprimento.ideal - suprimento.quantidade) + ' unidades')
      line = incrementLine(doc, line, 5)
    }
  }
  feedbacks--
  feedback(false)
  doc.save('pedido - ' + dia + '-' + mes + '-' + ano + '.pdf')
}