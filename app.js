import fs from 'fs/promises';
import cohere from 'cohere-ai';
cohere.init('fvdX91d6f5ioC0JyYNyVZwNwkeU48h45cXnS8ukY');

// read file file_ai.txt
async function translateTrascript() {
    const file = await fs.readFile('file_ai.txt', 'utf8');
    // split file into array of lines
    const lines = file.split('\n');
    const regexp = /(\d\d:\d\d:\d*\.\d\d)\[(Speaker \d)] (.*)/
    // iterate over lines
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        // if line contains time
        if (regexp.test(lines[i])) {
            // get time
            let time, speaker, text;
            [, time, speaker, text] = lines[i].match(regexp);
            // get text
            // log time and text
            result.push({time, speaker, text});
        }
    }

    let newResult = [];
    let currentSentenceState = {
        written: false,
        speaker: "",
        time: "",
        text: ""
    };
    result.forEach((item, index) => {
        const isEndOfSentence = item.text.endsWith('.') || item.text.endsWith('?') || item.text.endsWith('!');
      // each element is a part of a sentence. consolidate them into one sentence
        if (index === 0 && isEndOfSentence) {
            newResult.push(item);
            return
        } else if (index === 0 && !isEndOfSentence) {
            currentSentenceState = {
                written: false,
                speaker: item.speaker,
                time: item.time,
                text: item.text
            }
            return;
        }

        if (!currentSentenceState.written && isEndOfSentence) {
            currentSentenceState = {
                written: true,
                speaker: currentSentenceState. speaker + item.speaker,
                time: currentSentenceState.time + item.time,
                text: currentSentenceState.text + item.text
            }
            newResult.push({
                speaker: currentSentenceState.speaker,
                time: currentSentenceState.time,
                text: currentSentenceState.text
            });
        } else if (!currentSentenceState.written && !isEndOfSentence) {
            currentSentenceState = {
                written: false,
                speaker: currentSentenceState.speaker + item.speaker,
                time: currentSentenceState.time + item.time,
                text: currentSentenceState.text + item.text
            }
        } else if (currentSentenceState.written && !isEndOfSentence) {
            currentSentenceState = {
                written: false,
                speaker: item.speaker,
                time: item.time,
                text: item.text
            }
        } else if (currentSentenceState.written && isEndOfSentence) {
            currentSentenceState = {
                written: true,
                speaker: item.speaker,
                time: item.time,
                text: item.text
            }
            newResult.push({
                speaker: currentSentenceState.speaker,
                time: currentSentenceState.time,
                text: currentSentenceState.text
            });
        }
    });

    return newResult;
}

translateTrascript().then(async (result) => {
    let resultGroupedBy16Elements = [];
    let temp = [];
    result.forEach((item, index) => {
        temp.push(item);
        if (index % 16 === 0) {
            resultGroupedBy16Elements.push(temp);
            temp = [];
        }
    });

    resultGroupedBy16Elements.map(async (item) => {
        let res = await embed(item.map((item) => item.text));
        console.log(res);
    });
});

async function embed(arr) {
    const response = await cohere.embed({
        texts: arr
    });
    let firstEl = response.body.embeddings[0];
    let secondEl = response.body.embeddings[1];
    let similarity = cosineSimilarity(firstEl, secondEl);
    console.log(similarity);
}

function cosineSimilarity(a, b) {
    var dotProduct = 0;
    var mA = 0;
    var mB = 0;
    for (var i = 0; i < a.length; i++) {
        dotProduct += (a[i] * b[i]);
        mA += (a[i] * a[i]);
        mB += (b[i] * b[i]);
    }
    return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}