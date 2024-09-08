import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

export async function inicializaModelo(modelo) {
    const genAI = new GoogleGenerativeAI("AIzaSyA2OfHyucUqcmaMvyVrR2D15JCjcms1xgQ");
    const model = genAI.getGenerativeModel({ model: modelo });
    return model;
}