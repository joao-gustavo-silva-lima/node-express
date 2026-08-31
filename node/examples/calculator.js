class Calculator {
  static sum(...addends) {
    return addends.reduce((prevNumber, currNumber) => prevNumber + currNumber);
  }

  static subtract(...subtrahends) {
    return subtrahends.reduce(
      (prevNumber, currNumber) => prevNumber - currNumber,
    );
  }

  static multiply(...factors) {
    return factors.reduce((prevNumber, currNumber) => prevNumber * currNumber);
  }

  static divide(...divisors) {
    return divisors.reduce((prevNumber, currNumber) => prevNumber / currNumber);
  }
}

module.exports = { Calculator };
