const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const subtractYears = (years) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

const generateMockHR = () => {
  const age = randomBetween(30, 60);

  const yearsOfService = randomBetween(
    2,
    age - 24
  );
     const positions = [
        "GA",
        "AL",
        "L2",
        "L1",
        "SL",
        "Assoc.Prof",
        "Professor",
    ];

  return {
    dateOfBirth: subtractYears(age),
    position: positions[Math.floor(Math.random() * positions.length)],
    dateOfFirstAppointment:
      subtractYears(yearsOfService),

    isMockHRData: true,
  };
};

module.exports = {
  generateMockHR,
};