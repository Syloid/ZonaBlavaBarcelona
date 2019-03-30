$(document).ready(function () {
    posicioUsuari = [];
    getLocation();
    inicialitzar(3, null);
});
var lastUpdateTime;

function inicialitzar(frequencia, sort) {
    //aquesta funcio te 2 parametres, la frequencia de refresc i la de ordenacio
    lastUpdateTime = 0;
    interval = setInterval(consultaDades, frequencia * 1000, sort); //actualitzem dades cada quan toqui....
}



function consultaDades(sort) {
    $.ajax({
        url: 'https://opendata-ajuntament.barcelona.cat/resources/bsm/PSIU_AREABLAVA.JSON'
    }).done(function (data) {
        if (data.OPENDATA_PSIU_APPARKB[0].FH_INICIO != lastUpdateTime) { //si l'ultima data d'actualització es diferent a la del json actualitzem
            lastUpdateTime = data.OPENDATA_PSIU_APPARKB[0].FH_INICIO;
            //generem una nova data
            date = new Date(parseInt(lastUpdateTime.substring(6, 10)), parseInt(lastUpdateTime.substring(3, 5)) - 1, parseInt(lastUpdateTime.substring(0, 2)), 8, 0, 0);
            //variable resetdate per resetejar la data a l'hora de printar els horaris, perque surt mes a compte tindre un altre variable que anar restant x hores a l'original
            resetDate = date;
            netejarGrafics();
            actualitzaDadesPantalla(data, sort);
        }
    })
}

function getLocation() {
    if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(guardarPosicio);}
}

function netejarGrafics() {
    $("#mapid").remove();
    $("#grafiques").find("h1").remove();
    $("#donutchart").empty();
    $("#barChart").empty();
    $("#piechart_3d").empty();
}

function guardarPosicio(position) {
    //assignem les coordenades d'on es troba l'posicioUsuari
    posicioUsuari['latitude'] = position.coords.latitude;
    posicioUsuari['longitude'] = position.coords.longitude;
}

function actualitzaDadesPantalla(data, sort) {
    var aparcaments = data.OPENDATA_PSIU_APPARKB[1].TRAMOS[0].features; //agafem tots els aparcaments amb les seves dades i els afegim a una variable

    var TIPUS_ZONA = []; //Blava o verda
    var TIPUS_TARIFA = []; //Tots els tipus de tarifa
    var TIPUS_HORARI = []; // Tots els horaris

    for (i = 0; i < aparcaments.length; i++) {
        //anem omplint els 3 arrays amb dades que despres ens serviran per fer estadistiques
        isNaN(TIPUS_ZONA[aparcaments[i].properties.TIPO]) ? TIPUS_ZONA[aparcaments[i].properties.TIPO] = 0 : TIPUS_ZONA[aparcaments[i].properties.TIPO]++;
        isNaN(TIPUS_TARIFA[aparcaments[i].properties.TARIFA]) ? TIPUS_TARIFA[aparcaments[i].properties.TARIFA] = 0 : TIPUS_TARIFA[aparcaments[i].properties.TARIFA]++;
        isNaN(TIPUS_HORARI[aparcaments[i].properties.HORARIO]) ? TIPUS_HORARI[aparcaments[i].properties.HORARIO] = 0 : TIPUS_HORARI[aparcaments[i].properties.HORARIO]++;
    }
    map(aparcaments, sort); //generem el mapa amb o sense ordenacio depenent si la variable sort es null o es ´BLAVA´ o ´VERDA´
    $('#grafiques').prepend('<h1>Estadistiques</h1>');
    //generem les grafiques
    donutChart(TIPUS_ZONA);
    barChart(TIPUS_TARIFA);
    piechart3D(TIPUS_HORARI);
}

function convertirDadesPerChart(info, tipus) {
    //funcio que permet formatejar un array donat per fer-ho servir al google charts
    var datos = new Array(tipus);
    for (tipo in info) {
        var tipoinfo = new Array(tipo);
        tipoinfo.push(info[tipo]);
        datos.push(tipoinfo);
    }

    return datos;
}

function piechart3D(info) {
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(drawChart);
    function drawChart() {
        var datos = convertirDadesPerChart(info, ['Horari', 'Quantitat',]);
        var data = google.visualization.arrayToDataTable(datos);

        var options = { //opcions que li pasem perque quedi mes decent el piechart
            title: 'Quantitat d\'aparcaments segons horari ',
            pieHole: 0.4,
            backgroundColor: '#3b4147',
            pieSliceBorderColor: '#343a40',
            pieSliceTextStyle: {color: 'white'},
            legend: {position: 'bottom',textStyle: {color: 'white'}},
            titleTextStyle: {color: 'white'},
            is3D: true
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart_3d'));
        chart.draw(data, options);
        //modifiquem els atributs x i y del titol de la taula per que quedi centrat
        $("text:contains(Quantitat d\'aparcaments segons horari)").attr({ 'x': '535', 'y': '20' })
    }
}

function barChart(info) {
    var datos = convertirDadesPerChart(info, ['Tarifa', 'Quantitat',]);
    google.charts.load('current', { packages: ['corechart', 'bar'] });
    google.charts.setOnLoadCallback(drawBasic);

    function drawBasic() {
        var data = google.visualization.arrayToDataTable(datos);
        //data sort ordena les columnes que volem sense necessitat de nosaltres tenir que modificar el array de dades
        data.sort([{ column: 1, desc: true }, { column: 0, desc: true }]);

        var options = { //styles
            title: 'Preu de les tarifes',
            chartArea: { width: '50%' },
            colors: ['#007bff', '#1a88ff', '#3396ff', '#4da3ff', '#66b0ff'],
            hAxis: {
                title: 'Total Aparcaments',
                minValue: 0,
                textStyle: {color: 'white'},
                titleTextStyle: {color: 'white'},
                minorGridlines: {color: 'white'}
            },
            vAxis: {
                title: 'Tarifa', textStyle: {color: 'white'},titleTextStyle: {color: 'white'}
            },
            backgroundColor: '#3b4147',
            legend: { textStyle: { color: '#b7b7b7' } },
            titleTextStyle: {color: 'white'}
        };
        var chart = new google.visualization.BarChart(document.getElementById('barChart'));
        chart.draw(data, options);
    }
}

function donutChart(info) {
    var datos = convertirDadesPerChart(info, ["Tipus", "Zona"]);

    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable(datos);
        var options = { //styles
            title: 'Tipus de zones',
            pieHole: 0.4,
            colors: ['#007bff', '#28a745'],
            backgroundColor: '#3b4147',
            pieSliceBorderColor: '#343a40',
            pieSliceTextStyle: {color: 'white'},
            legend: { textStyle: { color: '#b7b7b7' } },
            titleTextStyle: {color: 'white'}
        };
        function seleccionat() {
            //aquesta funcio agafa l´event de click quan donem click a la primera grafica de donut en qualsevol opcio
            //en aquest cas, ´BLAVA´ o ´VERDA´, i refresca la pagina amb nomes la zona que s´ha escollit al mapa, (variable sort)
            //Documentacio: https://developers.google.com/chart/interactive/docs/basic_interactivity 
            var seleccio = chart.getSelection()[0];
            if (seleccio) {//si tenim la seleccio
                var seleccionat = data.getValue(seleccio.row, 0); //agafem el seleccionat a traves de data
                clearInterval(interval);
                inicialitzar(2, seleccionat);
            }
        }
        var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
        google.visualization.events.addListener(chart, 'select', seleccionat);
        chart.draw(data, options);
        //modifiquem els atributs x i y del titol de la taula per que quedi centrat
        $("text:contains(Tipus de zones)").attr({ 'x': '250', 'y': '20' })
    }

}

function afegirPosicioposicioUsuari() {
    //agafem la variable de posicio del usuari i afegim un marcador al mapa
    L.marker([posicioUsuari['latitude'], posicioUsuari['longitude']]).addTo(mymap).bindPopup('<h2>Localització actual</h2><ul><li>Latitud: ' + posicioUsuari['latitude'] + '</li><li>Longitud: ' + posicioUsuari['longitude'] + '</li></ul>');
}

function map(data, sort) {
    document.getElementById('mapContainer').innerHTML = "<div id='mapid' style='width: 100%; height: 80%; float: left;'></div>";

    mymap = L.map('mapid').setView([41.3908901, 2.1709899], 13);
    //generem el mapa
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {maxZoom: 18,id: 'mapbox.streets',accessToken: 'pk.eyJ1Ijoic3lsb2lkIiwiYSI6ImNqdDh5Zm14bzAzMXU0M3F0Z3YxOTc5dnEifQ.dENVumuAU-SgCnUDsaqeKQ'}).addTo(mymap);
    
    var i = 0;
    //anem afegint les zones
    for (i = 0; i < data.length; i++) {
        var zona = data[i].properties.TIPO;
        //si sort es null (no volem ordenar) o la zona es igual a la zona que volem filtrar, afegim el carrer
        if ((sort == null) || (zona == sort)) { 

            var localitzacioAparcament = data[i].geometry.coordinates[0][0];
            var localitzacioAparcament2 = data[i].geometry.coordinates[0][1];

            var default_color;
            //per defecte la zona es blava...si la zona es verda, canvio el color a verd
            zona !== 'BLAVA' ? default_color = "#28a745" : default_color = '#007bff';
            //afegim la inea
            var polygon = L.polyline([
                [localitzacioAparcament[1], localitzacioAparcament[0]],
                [localitzacioAparcament2[1], localitzacioAparcament2[0]]
            ], {
                    color: default_color
                }).addTo(mymap);
            //al bindpopup li agreguem la funcio de generar contingut popup que afegirar l´informacio relevant de la zona                
            polygon.bindPopup(generarContingutPopup(data[i].properties, localitzacioAparcament[1], localitzacioAparcament[0]));
        }
    }
    if (posicioUsuari !== 'undefined') { afegirPosicioposicioUsuari(); }
    $('.leaflet-control-zoom').append('<a class="" id="ultimaActualitzacio" href="#" title="Ultima actualització: ' + lastUpdateTime + '" role="button" aria-label="" style="outline: none;"><i class="fas fa-clock" style="margin: 8.7px;"></i></a>');
}

function generarContingutPopup(propietats, longitud, latitud) {
    //generar contingut/botons
    var content = document.createElement('div');
    var titol = document.createElement('h5');
    $(titol).text(propietats.TRAMO);
    $(content).append(titol);
    var id = document.createElement('p');
    $(id).html('<strong>ID:</strong> ' + propietats.ID_TRAMO);
    $(content).append(id);
    var horari = document.createElement('p');
    $(horari).html('<strong>HORARI: </strong>' + (propietats.HORARIO.replace('de ', ''))); //no vull que surti: "de Lunes a Viernes", queda lleig
    $(content).append(horari);
    var tipo = document.createElement('p');
    var zona = propietats.TIPO !== "BLAVA" ? "<span style='background-color:#369b43; color: white;'>VERDA</span>" : "<span style='background-color: #007bff; color: white'>BLAVA</span>";
    $(tipo).html('<strong>TIPUS: </strong>' + zona);
    $(content).append(tipo);
    var tarifa = document.createElement('p');
    $(tarifa).html('<strong>TARIFA: </strong>' + (propietats.TARIFA.replace('E', '<i class="fas fa-euro-sign"></i>'))); //vull que surti el simbol de euro en compte de E
    $(content).append(tarifa);
    var button = document.createElement('button');
    $(button).html('Veure predicicons');
    $(button).attr("class", "btn btn-secondary");
    var anar = document.createElement('button');
    $(anar).html('Anar');
    $(anar).attr("class", "btn btn-info");

    //quan li donem click al boto de veure prediccions ens fara una finestra modal amb una taula de les prediccions
    $(button).click(function () {generarPrediccio(propietats.TRAMO, propietats.PREDICCIONES, propietats.TIPO);});
    //quan li donem al botó d´anar ens generara la ruta desde la nostra localització fins a la zona blava/verda
    $(anar).click(function () {generarRuta(longitud, latitud);});

    $(content).append(button);
    $(content).append(anar);

    return content;
}

function generarRuta(longitud, latitud) {
    if (typeof routing !== "undefined") { routing.spliceWaypoints(0, 2); /*si existeix la borro*/ }
    //si no la creo
    routing = L.Routing.control({
        waypoints: [
            L.latLng(longitud, latitud),
            L.latLng(posicioUsuari['latitude'], posicioUsuari['longitude'])
        ],
        collapsible: true //collapsible true fara que es mostri un boto a la finestra de la ruta per poder tancar-la
    }).addTo(mymap);
}

$('div').on('click', '.leaflet-routing-collapse-btn', function () {
    //quan tanquem la finestra de la ruta borrem la ruta del mapa amb la seva respectiva finestra
    routing.spliceWaypoints(0, 2); //borrem ruta
    $('.leaflet-control-container').find('.leaflet-right').remove();
});

function generarPrediccio(titol, prediccions, tipus) {
    //cridem a la classe alert de bootbox per generar facilment un modal on el seu missatge sera una taula amb les nostres prediccions i unes llegendes
    bootbox.alert({
        size: "big",
        title: titol,
        message: desglosarPreddiccio(prediccions)
    });
    //si la zona on hem clickat es blava el border top será blau, sino verd, aixo es tema estils
    if (tipus == 'BLAVA') {
        $(".modal-header").css('border-bottom', '2px solid #168cff');
    } else {
        $(".modal-header").css('border-bottom', '2px solid #28a745');
    }


    var botons = generarBotons();

    var llegenda = "<div><ul class='llegenda'><li><strong>(80%) </strong>Hi ha gran disponibilitat de places lliures</li><li><strong>(30% - 80%) </strong>Disponibilitat mitja de places lliures</li><li><strong>(0% - 10%) </strong>No hi ha disponibilitat de places lliures o es pràcticament nula</li><li>No es coneix la predicció</li></ul></div>"
    $(".modal-footer").prepend(botons);
    $(".modal-footer").prepend(llegenda);
    date = new Date(parseInt(lastUpdateTime.substring(6, 10)), parseInt(lastUpdateTime.substring(3, 5)) - 1, parseInt(lastUpdateTime.substring(0, 2)), 8, 0, 0); //resetejem
}

function generarBotons() {
    //afegim al footer del modal dos 2 botons, per veure les prediccions dels 2 dies
    var div = document.createElement('div');
    var buttonNext = document.createElement('a');
    var date2 = sumarDia(date, 1);

    $(buttonNext).addClass('btn btn-secondary');
    $(buttonNext).attr('href', '');
    $(buttonNext).text("Previsió " + date2.toString().substring(0, date.toString().indexOf("08:00:00")));
    $(buttonNext).click(function (e) {
        //utilitzo prevent default perque no vull que al clickar a l´etiqueta <a> em redirigeixi a cap lloc
        //el que vull es que faci display none de les previsions actuals que estavan visibles i fer visibles les noves
        e.preventDefault();
        $("#taula1").css('display', 'none');
        $("#taula2").css('display', 'table');
    });

    var buttonPrev = document.createElement('a');

    $(buttonPrev).text("Previsió " + date.toString().substring(0, date.toString().indexOf("08:00:00")));
    $(buttonPrev).addClass('btn btn-secondary');
    $(buttonPrev).attr('href', '');
    $(buttonPrev).click(function (e) {
        e.preventDefault();
        $("#taula2").css('display', 'none');
        $("#taula1").css('display', 'table');
    });
    $(div).addClass('botons')
    $(div).append(buttonPrev);
    $(div).append(buttonNext);

    return div;
}


function sumarDia(date, dia) {
    //funcio que sunma un dia a la data
    var resultat = new Date(date);
    resultat.setDate(resultat.getDate() + dia);
    return resultat;
}

function desglosarPreddiccio(prediccio) {
    //generem la primera taula de prediccions
    var taula1 = generarTaulaPrediccions(1, date, prediccio.slice(0, prediccio.length / 2));
    date.setHours(8);
    date.setMinutes(0);

    var date2 = sumarDia(date, 1);
    //segona taula de prediccions
    var taula2 = generarTaulaPrediccions(2, date2, prediccio.slice(prediccio.length / 2));
    date2.setHours(8);
    date2.setMinutes(0);
    //les afgegim al div del contenidor del modal per reotrnarles
    var contenedor = document.createElement('div');
    $(contenedor).append(taula1);
    $(contenedor).append(taula2);

    return contenedor;
}
function formatejarTemps(date) {
    //tema format, no vull que cap data estigui formatejada amb nomes 1 digit (ex: 8:0)
    if (date < 10) {
        return "0" + date;
    }
    return date;
}

function limpiarPrediccions(prediccio, date) {
    //formateja les prediccions en bon format amb la funcio 'netejar temps'
    var prediccioLimpia = [];
    var i;
    for (i = 0; i < prediccio.length; i++) {
        var hores = formatejarTemps(date.getHours());
        var minuts = formatejarTemps(date.getMinutes());
        var horaPrediccio = hores + ":" + minuts;

        prediccioLimpia[horaPrediccio] = prediccio.charAt(i);
        date.setMinutes(date.getMinutes() + 5);
    }

    return prediccioLimpia;
}

function generarTaulaPrediccions(numTaula, date, prediccio) {
    //Informacio sobre les prediccions:
    //Es un string de 288 caracters que representa les 08:00 del mati fins les 20:00 de dos dies (144/144)
    //A le hores, els caractes representen l'estat de la prediccio de la zona en els seguents 5 minuts i depenent d'aquest numero jo printo un color o un altre
    //Mes informació:  https://opendata-ajuntament.barcelona.cat/data/es/dataset/siu-area-blava 
    var prediccionsLimpies = limpiarPrediccions(prediccio, date);
    var div = document.createElement('div');
    $(div).load("table.html", null, function () { //carreguem un document html en el que es simplement una taula.html ben formatejada
        $(this).find("table").attr("id", "taula" + numTaula); //li posem un id a la taula per despres diferenciar
        //si el numero de la taula es el 2, l'ocultem per defecte
        numTaula == 2 ? $(this).find("table").css('display', 'none') : null;
        var tbody = $(this).find("table").find('tbody');

        $(tbody).find('td').each(function (j) {
            //per cada td mirem el seu atribut class que es la hora, i afegim el color de la prediccio que correspon amb la funcio formatejarPrediccio
            if ($(this).attr("rowspan") == undefined) {
                var className = $(this).attr("class");
                var horaPrediccio = className.substring(0, 2) + ":" + className.substring(3, 5);

                $(this).css('background-color', formatejarPrediccio(prediccionsLimpies[horaPrediccio]));
                date.setMinutes(date.getMinutes() + 5);
            }
        });
    });
    return div;
}

function formatejarPrediccio(numero) {
    if (numero == 0) {
        return "rgb(101, 107, 113)"; //gris
    } else if (numero == 1) {
        return "#28a745"; //verd
    } else if (numero == 2) {
        return "#e49420"; //taronja
    } else {
        return "#dc3545"; //vermell
    }
}

$("div").on('click', '#ultimaActualitzacio', function () {
    //quan fem click al botó d'última actualització, reiniciem tot
    clearInterval(interval);
    inicialitzar(3, null);
});