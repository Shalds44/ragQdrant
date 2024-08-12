import { useState } from 'react';
import { useChat } from 'ai/react';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { formatDocumentsAsString } from "langchain/util/document";
import { StreamingTextResponse, Message } from "ai";

export function useChatWithRAG() {
  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, error,
    stop,
    setMessages,
    setInput, } = useChat();
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (event) => {
    
        const selectedModel = 'phi3:latest'
        event.preventDefault();
        if (input.trim() === '') return;

        setIsLoading(true);
        const clientQdrant = new QdrantClient({url: 'http://127.0.0.1:6333'});
        // const result = await clientQdrant.getCollections();
    
        const model = new ChatOllama({
            baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
            model: selectedModel,
        });
    
        const modelEmbedding = new OllamaEmbeddings({
            model: 'mxbai-embed-large'
        });
    console.log(selectedModel)
    
        // Définir les métadonnées du document
        const metadata = {
            author: "Ronan",
            date: "2024-07-08",
            topic: "Management"
        };
  
        // Contenu du document
        // const mdSplitter = new RecursiveCharacterTextSplitter({
        //     chunkSize: 200,
        //     chunkOverlap: 10,
        // });

        // const resDataMock = await fetch("api/datamock")
        // const stringResDataMock = await resDataMock.text()
        // const mdDocs = await mdSplitter.createDocuments([stringResDataMock]);
        // const splits = await mdSplitter.splitDocuments(mdDocs);
        // console.log(splits)

        // const pageContent = "Le front rozoh est géré par Ronan";
        // const docDoc = [
        //     new Document({
        //     pageContent: pageContent,
        //     metadata: metadata
        //   })
        // ];

        // clientQdrant.createCollection("modelvuejs", {
        //     vectors: { size: 1024., distance: "Cosine" },
        //   });


        try {
        console.log("vectorstore")
        // const vectorstore = await QdrantVectorStore.fromDocuments(
        //     splits,
        //     modelEmbedding,
        //     {
        //         client: clientQdrant,
        //         collectionName: "modelvuejs",
        //     }  
        // )

        const vectorstore = await QdrantVectorStore.fromExistingCollection(modelEmbedding, { client: clientQdrant, collectionName: "modelvuejs"})

        const prompt = PromptTemplate.fromTemplate(`Répond à la question en 20 mots en te basant uniquement sur le contexte suivant:{context} Question: {question}`);      
            
        //   const retriever = await vectorstore.similaritySearch("A quoi sert le dossier dist ?")
        const retriever = vectorstore.asRetriever({ k: 4, searchType: "similarity" });
        
        const qaChain = RunnableSequence.from([
            {
                context: retriever.pipe(formatDocumentsAsString),
                question: new RunnablePassthrough(),
            },
            prompt,
            model,
            new StringOutputParser(),
        ]);

        const resultRag = await qaChain.invoke("quels sont les librairie d'icon utilisées ?");
        console.log(resultRag);
        messages.push({ role: "user", content: "je suis content", id: "78" });
        
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

    // Ajouter la réponse de l'IA

    setIsLoading(false);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setMessages,
    setInput,
  };
}