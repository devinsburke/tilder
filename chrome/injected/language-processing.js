const rNonAlpha = /[^A-Za-z]/g;

class TerseNaturalLanguageProcessor {
	constructor(stopwords=defaultStopwords) {
		this.stopwords = stopwords;
	}
	
	toBagOfWords(words, removeStopwords=false) {
		if (removeStopwords)
			words = this.removeStopwords(words);
		
		var countByWord = this.toVocabulary(words).map(
			w => [w, words.filter(iw => iw == w).length]
		);
		return Object.fromEntries(countByWord);
	}
	
	toWords(text) {
		return text
			.replace(rNonAlpha, ' ')
			.split(' ')
			.map(w => w);
	}
	
	removeStopwords(listOfWords) {
		return listOfWords.filter(w => !this.stopwords.includes(w.toLowerCase()));
	}
	
	toVocabulary(...listOfWords) {
		return Array.from(new Set([].concat.apply([], listOfWords)));
	}
	
	getSimilarityScores(normalize, ...bagOfWords) {
		var matrix = this.getSimilarityMatrix(...bagOfWords);
		return this.scoreSimilarityMatrix(matrix, normalize);
	}
	
	getSimilarityMatrix(...bagOfWords) {
		var length = bagOfWords.length;
		var matrix = this.buildMatrix(length, 2);
		
		for (var i = 0; i < length - 1; i++) {
			for (var j = i + 1; j < length; j++) {
				var similarity = this.getSimilarity(bagOfWords[i], bagOfWords[j]);
				matrix[i][j] = similarity;
				matrix[j][i] = similarity;
			}
		}
		return matrix;
	}
	
	buildMatrix(length, dimensions) {
		if (dimensions == 1) {
			return Array(length).fill(0);
		} else {
			return Array(length).fill().map(_ => this.buildMatrix(length, dimensions-1));
		}
	}
	
	getSimilarity(bagOfWords1, bagOfWords2) {
		var vocab = this.toVocabulary(
			Object.keys(bagOfWords1),
			Object.keys(bagOfWords2)
		);
		return this.cosineSimilarity(
			this.normalizeWordsToVocab(vocab, bagOfWords1),
			this.normalizeWordsToVocab(vocab, bagOfWords2)
		);
	}
	
	normalizeWordsToVocab(vocab, bagOfWords) {
		return vocab.map(v => bagOfWords[v] || 0);
	}
	
	cosineSimilarity(vector1, vector2) {
		var ab = this.getDotProduct(vector1, vector2);
		var aa = this.getDotProduct(vector1, vector1);
		var bb = this.getDotProduct(vector2, vector2);
		return ab/(Math.sqrt(aa)*Math.sqrt(bb));
	}
	
	getDotProduct(vector1, vector2) {
		return vector1.reduce((accum, val, i) => accum + val*vector2[i], 0);
	}
	
	scoreSimilarityMatrix(matrix, normalize=false) {
		var scores = matrix.map(m => m.reduce((a,b) => a+b));
		return normalize ? this.normalizeScoreList(scores) : scores;
	}
	
	normalizeScoreList(scores) {
		var total = scores.reduce((a,b) => a+b);
		return scores.map(m => m / total);
	}
}