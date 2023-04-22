import { Program } from "@coral-xyz/anchor";
import { RemitanoProject } from "../../target/types/remitano_project";
import RemitanoService from "../services/remitano.service";

export const anchorProvider = anchor.AnchorProvider.env();
anchor.setProvider(anchorProvider);
export const program = anchor.workspace
  .RemitanoProject as Program<RemitanoProject>;
export const remitanoService = new RemitanoService(program);
