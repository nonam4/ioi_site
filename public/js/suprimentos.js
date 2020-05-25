const selecionarSuprimentos = () => {
    if(tela != 'suprimentos') {
        tela = 'suprimentos'
        document.getElementById('listagem').innerHTML = ''
        listagem(false)
      }
}

const listagemSuprimentos = () => {
    
    $('suprimento .qtd').mask('000')
    var container = document.getElementById('tSurpimentosContainer').content.cloneNode(true)
    var holder = new DocumentFragment()

    for(var x = 0; x < Object.keys(suprimentos).length; x++) {
        var suprimento = suprimentos[Object.keys(suprimentos)[x]]
        var interface = document.getElementById('tSurpimento').content.cloneNode(true)

        interface.querySelector('#salvar').onclick = (suprimento => {
            return () => {salvarSuprimento(suprimento)}
        })(suprimento)
        interface.querySelector('suprimento').id = suprimento.id
        interface.querySelector('#modelo').innerHTML = '<span>Modelo</span>' + toTitleCase(suprimento.modelo)
        interface.querySelector('#minimo').innerHTML = "<span>Quantidade Mínima</span><input onkeyup='conferirSuprimentos(this)' class='simpleInput qtd' type='text' value='" + suprimento.minimo + "'></div>"
        interface.querySelector('#quantidade').innerHTML = "<span>Quantidade Atual</span><input onkeyup='conferirSuprimentos(this)' class='simpleInput qtd' type='text' value='" + suprimento.quantidade + "'></div>"

        if(suprimento.minimo >= suprimento.quantidade) {
            interface.querySelector('suprimento').classList.add('acabando')
            interface.querySelector('#modelo').classList.add('acabando')
            interface.querySelector('#minimo input').classList.add('acabando')
            interface.querySelector('#quantidade input').classList.add('acabando')
        }
        holder.appendChild(interface)
    }
    var add = document.getElementById('tSuprimentoAdicionar').content.cloneNode(true)
    container.querySelector('#suprimentos').appendChild(holder)
    container.querySelector('#suprimentos').appendChild(add)
    document.getElementById('listagem').appendChild(container)
}

const adicionarSuprimento = el => {
    var suprimento = document.getElementById('tSurpimento').content.cloneNode(true)
    var container = suprimento.querySelector('suprimento')
    container.style.opacity = '0'

    suprimento.querySelector('#modelo').innerHTML = "<span>Modelo</span><input class='simpleInput' type='text' placeholder='Digite aqui'></div>"
    suprimento.querySelector('#minimo').innerHTML = "<span>Quantidade Mínima</span><input class='simpleInput qtd' type='text' value='0'></div>"
    suprimento.querySelector('#quantidade').innerHTML = "<span>Quantidade Atual</span><input class='simpleInput qtd' type='text' value='0'></div>"

    suprimento.querySelector('#salvar').className = 'fas fa-save'
    suprimento.querySelector('#salvar').onclick = (container => {
        return () => {

            var modelo = toTitleCase(container.querySelector('#modelo input').value)
            var minimo = parseInt(container.querySelector('#minimo input').value)
            var quantidade = parseInt(container.querySelector('#quantidade input').value)

            var suprimento = {
                id: new Date().getTime() + '',
                modelo: modelo,
                minimo: minimo,
                quantidade: quantidade
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

    $(suprimento).insertBefore(el.parentNode)
    setTimeout(() => {
        container.style.opacity = '1'
    }, 50)
}

const salvarSuprimento = suprimento => {
    //se o suprimento já estiver na lista de suprimentos
    var layout = document.getElementById(suprimento.id)
    if(suprimentos[suprimento.id] != undefined) {
        
        var quantidade = parseInt(layout.querySelector('#quantidade input').value)
        var minimo = parseInt(layout.querySelector('#minimo input').value)

        if(suprimento.quantidade == quantidade && suprimento.minimo == minimo) {
            error('Nenhuma alteração para salvamento foi detectada')
        } else {
            suprimento.quantidade = quantidade
            suprimento.minimo = minimo

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

    if((suprimento.quantidade != quantidade || suprimento.minimo != minimo) && 
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
        
        var interface = document.getElementById(suprimento.id)
        interface.querySelector('suprimento').classList.add('acabando')
        interface.querySelector('#modelo').classList.add('acabando')
        interface.querySelector('#minimo input').classList.add('acabando')
        interface.querySelector('#quantidade input').classList.add('acabando')
    }
}