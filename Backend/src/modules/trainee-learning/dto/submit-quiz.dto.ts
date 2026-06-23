import { IsObject } from 'class-validator';

export class SubmitQuizDto {
  /** Clé = id question, valeur = index de la bonne réponse choisie (0-based). */
  @IsObject()
  answers!: Record<string, number>;
}
