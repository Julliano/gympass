const fs = require('fs');

let names;
function readLog() {
    fs.readFile("./logs/logKart.txt", 'utf-8', (err, content) => {
        if (err) {
            return console.log(new Error('Erro na leitura do arquivo'));
        }
        names = content.toString().split("\n");
        bestRaceLap = null;
        names.splice(0,1);
        names = splitLogLines(names);
        arrival = endPosition(names);
        arrival = mediumSpeed(arrival);
        orderByTotalTime(arrival);
        createArriveAtribute(arrival);
        console.log(printBestLap());
        console.log(printEndPositions());
    });
}

function splitLogLines(names) {
    for (var i = 0; i < names.length; ++i) {
        names[i] = names[i].replace(/\s+/g,' ').trim();
        let splits = names[i].split(' ');
        try {
            splits[1] = splits[1] + splits[2] + splits[3];
            splits.splice(2, 2);
            names[i] = lineToJson(splits);
        } catch (error) {
            throw 'Error reading lines';
        }
    }
    return names;
}

function lineToJson(values){
    return obj = {
        'Racer': values[1],
        'Lap nº': values[2],
        'Lap Time': values[3],
        'Average speed': values[4],
    }
}

function endPosition(names) {
    positions = {};
    finalPosition = [];
    names.forEach(n => {
        if (n['Lap Time']) {
            if (!positions[n.Racer.split('–')[0]]) {
                // caso não existe a chave <code>, do Racer, em positions, ela é criada;
                positions[n.Racer.split('–')[0]] = {};
                positions[n.Racer.split('–')[0]].lapsCompleted = 1;
                positions[n.Racer.split('–')[0]].code = n.Racer.split('–')[0];
                positions[n.Racer.split('–')[0]].name = n.Racer.split('–')[1];
                positions[n.Racer.split('–')[0]].averageSpeed = parseFloat(n['Average speed'].replace(',','.'));
                positions[n.Racer.split('–')[0]].totalTime = n['Lap Time'].replace('.',':');
                positions[n.Racer.split('–')[0]].bestLap = n['Lap Time'].replace('.',':');
                bestLap(n);
                finalPosition.push(positions[n.Racer.split('–')[0]]);
            } else {
                // caso exista a chave é incrementeada a qtd de voltas e atualizado o tempo total;
                positions[n.Racer.split('–')[0]].lapsCompleted += 1;
                positions[n.Racer.split('–')[0]].averageSpeed += parseFloat(n['Average speed'].replace(',','.'));
                positions[n.Racer.split('–')[0]].bestLap = updateBestLap(positions[n.Racer.split('–')[0]].bestLap, n['Lap Time']);
                let tempo1 = stringToDate(positions[n.Racer.split('–')[0]].totalTime);
                let tempo2 = stringToDate(n['Lap Time'].replace('.',':'));
                let tempo = new Date();
                tempo.setHours(0, (tempo1.getMinutes() + tempo2.getMinutes()),
                    (tempo1.getSeconds() + tempo2.getSeconds()), (tempo1.getMilliseconds() + tempo2.getMilliseconds()));
                tempoSomado = `${tempo.getMinutes()}:${checkDigtLength(tempo.getSeconds())}:${checkDigtLength(tempo.getMilliseconds())}`;
                positions[n.Racer.split('–')[0]].totalTime = tempoSomado;
            }
        }
    });

    return finalPosition;
}

function stringToDate(timestr) {
    let parts = timestr.split(":");
    let date = new Date();
    date.setHours(0, parts[0], parts[1], parts[2]);
    return date;
}

function updateBestLap(current, newParamValue) {
    let currentValue = dateStringToNumber(current);
    let newValue = dateStringToNumber(newParamValue);
    if (currentValue < newValue) return current;
    return newParamValue.replace('.',':');
}

function orderByTotalTime(arrival) {
    // Orderna por tempo total;
    arrival.sort((a, b) => {
        let first = dateStringToNumber(a.totalTime);
        let second = dateStringToNumber(b.totalTime);
        return first - second;
    });
    // Ordena colocando os com menores voltas completadas no final;
    arrival.sort((a, b) => {
        return b.lapsCompleted - a.lapsCompleted;
    });
}

function dateStringToNumber(time) {
    return time.replace(/:/g,'').length < 6 ? time.concat('0').replace(/:/g,'') : time.replace(/:/g,'');
}

function createArriveAtribute(arrival) {
    for (let i = 0; i < arrival.length; i++) {
        arrival[i].posicao = `${i+1}º`;
        let winningTime = stringToDate(arrival[0].totalTime);
        if (i > 0) {
            let firstTime = stringToDate(arrival[i].totalTime);
            let date = new Date();
            date.setHours(0, (firstTime.getMinutes() - winningTime.getMinutes()),
                (firstTime.getSeconds() - winningTime.getSeconds()), (firstTime.getMilliseconds() - winningTime.getMilliseconds()));
            sumTime = `${checkDigtLength(date.getMinutes())}:${checkDigtLength(date.getSeconds())}:${checkDigtLength(date.getMilliseconds())}`;
            arrival[i].timeAfterWinner = sumTime;
        }
    }
}

function mediumSpeed(arrival) {
    for (const racer of arrival) {
        racer.averageSpeed = (racer.averageSpeed / racer.lapsCompleted).toFixed(3);
    }
    return arrival;
}

function bestLap(lap) {
    if (!bestRaceLap) return bestRaceLap = lap;
    let localLap = dateStringToNumber(lap['Lap Time'].replace('.', ':'));
    let localBestRaceLap = dateStringToNumber(bestRaceLap['Lap Time']);
    if (localLap < localBestRaceLap) bestRaceLap = lap;
}

function checkDigtLength(time) {
    if (time < 10) return '0'.concat(time.toString());
    return time;
}

function printBestLap() {
    return `\nBest lap: ${bestRaceLap.Racer}, Lap Nº: ${bestRaceLap['Lap nº']}, Time: ${bestRaceLap['Lap Time']} \n`
}

function printEndPositions() {
    let print = ``;
    for (const i in arrival) {
        print += `${arrival[i].posicao} ${arrival[i].name} - race total time: ${arrival[i].totalTime}`;
        print += ` - racer best lap: ${arrival[i].bestLap} - average speed: ${arrival[i].averageSpeed}`;
        if (i > 0) {
            print += ` - time after winner: ${arrival[i].timeAfterWinner} \n`;
        } else {
            print += ` - congratulations to the winner ;)\n`;
        }
    }
    return print;
}

readLog();