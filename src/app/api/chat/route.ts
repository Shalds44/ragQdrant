import { StreamingTextResponse, Message } from "ai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("Dans le Post")
  const { messages, selectedModel } = await req.json();
  const clientQdrant = new QdrantClient({url: 'http://127.0.0.1:6333'});
  // const result = await clientQdrant.getCollections();

  const model = new ChatOllama({
    baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
    model: selectedModel,
  });

  const modelEmbedding = new OllamaEmbeddings();


  // Définir les métadonnées du document
  const metadata = {
    author: "Ronan",
    date: "2024-07-08",
    topic: "Management"
  };

  // Contenu du document
  const pageContent = "Le front rozoh est géré par Ronan";

  const docDoc = [
      new Document({
      pageContent: pageContent,
      metadata: metadata
    })
  ];

  try {
    console.log("vectorstore")
    const vectorstore = await QdrantVectorStore.fromDocuments(
      docDoc,
      modelEmbedding,
      {
        client: clientQdrant,
      }  
    )
    const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
    const retriever = vectorstore.asRetriever()

    const qaChain = RunnableSequence.from([
      {
        context: (input: { question: string }, callbacks) => {
          const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
          return retrieverAndFormatter.invoke(input.question, callbacks);
        },
        question: new RunnablePassthrough(),
      },
      ragPrompt,
      model,
      new StringOutputParser(),
    ]);

    console.log("Je pose ma question")
    const question = "Qui s'occupe de Rozoh?";
    const resultRag = await qaChain.invoke({ question });
    console.log(resultRag)

  } catch (error) {
    console.log(error)
  }

  const parser = new BytesOutputParser();

  const stream = await model
    .pipe(parser)
    .stream(
      (messages as Message[]).map((m) =>
        m.role == "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content)
      )
    );


  return new StreamingTextResponse(stream);
}
