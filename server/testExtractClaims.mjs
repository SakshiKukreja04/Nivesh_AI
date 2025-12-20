import('./src/services/claimExtractor.js').then(({ extractClaims }) => {
  const sampleChunk = {
    id: "1",
    text: `
      Razorpay has raised $700M in funding. The team consists of 500 employees.
      The company is based in Bengaluru, India, and operates in the FinTech sector.
      Their annual revenue is $100M. User base: 1 million businesses.
      Growth rate: 30% annually. Stage: late.
    `,
    metadata: {}
  };
  const claims = extractClaims([sampleChunk]);
  console.log("Extracted Claims:\n", JSON.stringify(claims, null, 2));
});
