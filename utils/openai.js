
// Utility to call OpenAI API
export async function callOpenAI(inputText, apiKey) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that identifies movie titles from input text."
                },
                {
                    role: "user",
                    content: `Extract movie titles from the following text:\n${inputText}. 
                    list each title on a seperate line. Do not number the results, just the title please.
                    Do not include "The movie title in the given text is" in the output, just the title.
                    double check your work.`
                }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim();
}