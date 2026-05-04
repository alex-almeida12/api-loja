import express, { Request, Response, NextFunction } from "express";
import { readFile, writeFile } from "fs/promises";

const app = express();
const PORTA = 3000;

// ============================================================
// INTERFACES — TIPAGEM (Aulas 05 e 10)
// ============================================================

// Entidade principal
interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  estoque: number;
  disponivel: boolean;
}

// Body do POST (API JSON) — campos obrigatórios para criar
interface CriarProdutoBody {
  nome: string;
  preco: number;
  categoria: string;
  estoque: number;
}

// Body do PUT — todos opcionais (atualização parcial)
interface AtualizarProdutoBody {
  nome?: string;
  preco?: number;
  categoria?: string;
  estoque?: number;
}

// Params da URL — params SEMPRE é string
interface ProdutoParams {
  id: string;
}

// Query strings — query SEMPRE é string
interface FiltroQuery {
  categoria?: string;
  disponivel?: string;
  sucesso?: string;
  erro?: string;
}

// Padrão de resposta da API (Aula 10)
interface ApiResponse<T> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
  erros?: string[];
}

// ============================================================
// PERSISTÊNCIA EM JSON — fs.promises (Aula 14)
// ============================================================

const ARQUIVO_DADOS = "dados/produtos.json";

// Lê os produtos do arquivo JSON (cria arquivo vazio se não existir)
async function carregarProdutos(): Promise<Produto[]> {
  try {
    const texto = await readFile(ARQUIVO_DADOS, "utf-8");
    return JSON.parse(texto) as Produto[];
  } catch {
    // Primeira execução: arquivo não existe → criar com dados iniciais
    const iniciais: Produto[] = [
      { id: 1, nome: "Camiseta Básica", preco: 49.90, categoria: "Roupa", estoque: 25, disponivel: true },
      { id: 2, nome: "Fone Bluetooth", preco: 89.90, categoria: "Eletrônico", estoque: 10, disponivel: true },
      { id: 3, nome: "Café Gourmet 500g", preco: 32.50, categoria: "Alimento", estoque: 0, disponivel: false },
      { id: 4, nome: "Mouse Gamer RGB", preco: 149.90, categoria: "Eletrônico", estoque: 7, disponivel: true },
    ];
    await writeFile(ARQUIVO_DADOS, JSON.stringify(iniciais, null, 2));
    console.log("📄 dados/produtos.json criado com 4 produtos iniciais!");
    return iniciais;
  }
}

// Salva os produtos no arquivo JSON
async function salvarProdutos(produtos: Produto[]): Promise<void> {
  await writeFile(ARQUIVO_DADOS, JSON.stringify(produtos, null, 2));
}

// ============================================================
// MIDDLEWARES (Aulas 09, 10, 11, 12)
// ============================================================

// Middleware built-in: ler JSON do body (Thunder Client, APIs)
app.use(express.json());

// Middleware built-in: ler dados de formulários HTML
app.use(express.urlencoded({ extended: true }));

// Middleware built-in: servir arquivos estáticos (HTML, CSS, imagens)
app.use(express.static("public"));

// Middleware customizado: logger de requisições (Aula 09)
app.use((req: Request, res: Response, next: NextFunction) => {
  const agora = new Date().toLocaleTimeString();
  console.log(`[${agora}] ${req.method} ${req.url}`);
  next();
});

// Middleware reutilizável: validação de campos obrigatórios (Aula 10)
function validarCampos(camposObrigatorios: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const erros: string[] = [];
    for (const campo of camposObrigatorios) {
      if (req.body[campo] === undefined || req.body[campo] === null || req.body[campo] === "") {
        erros.push(`Campo '${campo}' é obrigatório`);
      }
    }
    if (erros.length > 0) {
      const resposta: ApiResponse<null> = { sucesso: false, erros };
      res.status(400).json(resposta);
      return;
    }
    next();
  };
}

// Categorias válidas
const CATEGORIAS_VALIDAS = ["Eletrônico", "Roupa", "Alimento", "Outro"];

// ============================================================
// CONFIGURAÇÃO DO EJS (Aula 11)
// ============================================================

app.set("view engine", "ejs");
app.set("views", "./src/views");

// ============================================================
// ROTAS DE API (JSON) — CRUD COMPLETO com async/await
// ============================================================

// ---------- GET /produtos — Listar e filtrar (Aulas 08, 10, 14) ----------
app.get(
  "/produtos",
  async (req: Request<{}, {}, {}, FiltroQuery>, res: Response) => {
    try {
      let produtos = await carregarProdutos();

      // Filtro por categoria (query string opcional)
      if (req.query.categoria) {
        produtos = produtos.filter((p) => p.categoria === req.query.categoria);
      }

      // Filtro por disponibilidade (query é SEMPRE string!)
      if (req.query.disponivel === "true") {
        produtos = produtos.filter((p) => p.disponivel);
      } else if (req.query.disponivel === "false") {
        produtos = produtos.filter((p) => !p.disponivel);
      }

      const resposta: ApiResponse<Produto[]> = { sucesso: true, dados: produtos };
      res.json(resposta);
    } catch {
      res.status(500).json({ sucesso: false, erro: "Erro ao carregar produtos" });
    }
  }
);

// ---------- GET /produtos/:id — Buscar por ID (Aulas 08, 10, 14) ----------
app.get(
  "/produtos/:id",
  async (req: Request<ProdutoParams>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const produtos = await carregarProdutos();
      const produto = produtos.find((p) => p.id === id);

      if (!produto) {
        const resposta: ApiResponse<null> = {
          sucesso: false,
          erro: `Produto com ID ${id} não encontrado`,
        };
        res.status(404).json(resposta);
        return;
      }

      const resposta: ApiResponse<Produto> = { sucesso: true, dados: produto };
      res.json(resposta);
    } catch {
      res.status(500).json({ sucesso: false, erro: "Erro ao buscar produto" });
    }
  }
);

// ---------- POST /produtos — Criar via API JSON (Aulas 08, 09, 10, 14) ----------
app.post(
  "/produtos",
  validarCampos(["nome", "preco", "estoque"]),
  async (req: Request<{}, {}, CriarProdutoBody>, res: Response) => {
    try {
      const { nome, preco, categoria, estoque } = req.body;

      // Validação adicional de tipos em runtime (Aula 10)
      const erros: string[] = [];
      if (typeof nome !== "string") erros.push("nome deve ser texto");
      if (typeof preco !== "number" || preco <= 0) erros.push("preco deve ser número maior que 0");
      if (typeof estoque !== "number" || estoque < 0) erros.push("estoque deve ser número >= 0");
      if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
        erros.push(`categoria deve ser: ${CATEGORIAS_VALIDAS.join(", ")}`);
      }

      if (erros.length > 0) {
        const resposta: ApiResponse<null> = { sucesso: false, erros };
        res.status(400).json(resposta);
        return;
      }

      const produtos = await carregarProdutos();

      // Gerar ID automático
      const novoId = produtos.length > 0 ? produtos[produtos.length - 1].id + 1 : 1;

      const novoProduto: Produto = {
        id: novoId,
        nome,
        preco,
        categoria: categoria || "Outro",
        estoque,
        disponivel: estoque > 0,  // Calculado automaticamente
      };

      produtos.push(novoProduto);
      await salvarProdutos(produtos);

      const resposta: ApiResponse<Produto> = { sucesso: true, dados: novoProduto };
      res.status(201).json(resposta);
    } catch {
      res.status(500).json({ sucesso: false, erro: "Erro ao criar produto" });
    }
  }
);

// ---------- PUT /produtos/:id — Atualizar (Aulas 09, 10, 14) ----------
app.put(
  "/produtos/:id",
  async (req: Request<ProdutoParams, {}, AtualizarProdutoBody>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const produtos = await carregarProdutos();
      const index = produtos.findIndex((p) => p.id === id);

      if (index === -1) {
        res.status(404).json({ sucesso: false, erro: `Produto com ID ${id} não encontrado` });
        return;
      }

      // Validação dos campos enviados
      const erros: string[] = [];
      if (req.body.nome !== undefined && typeof req.body.nome !== "string") {
        erros.push("nome deve ser texto");
      }
      if (req.body.preco !== undefined && (typeof req.body.preco !== "number" || req.body.preco <= 0)) {
        erros.push("preco deve ser número maior que 0");
      }
      if (req.body.estoque !== undefined && (typeof req.body.estoque !== "number" || req.body.estoque < 0)) {
        erros.push("estoque deve ser número >= 0");
      }
      if (req.body.categoria !== undefined && !CATEGORIAS_VALIDAS.includes(req.body.categoria)) {
        erros.push(`categoria deve ser: ${CATEGORIAS_VALIDAS.join(", ")}`);
      }

      if (erros.length > 0) {
        res.status(400).json({ sucesso: false, erros });
        return;
      }

      // Atualizar usando spread (preserva campos não enviados)
      produtos[index] = { ...produtos[index], ...req.body };
      produtos[index].id = id;  // Proteger o ID
      produtos[index].disponivel = produtos[index].estoque > 0;  // Recalcular

      await salvarProdutos(produtos);

      const resposta: ApiResponse<Produto> = { sucesso: true, dados: produtos[index] };
      res.json(resposta);
    } catch {
      res.status(500).json({ sucesso: false, erro: "Erro ao atualizar produto" });
    }
  }
);

// ---------- DELETE /produtos/:id — Remover (Aulas 09, 10, 14) ----------
app.delete(
  "/produtos/:id",
  async (req: Request<ProdutoParams>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const produtos = await carregarProdutos();
      const index = produtos.findIndex((p) => p.id === id);

      if (index === -1) {
        res.status(404).json({ sucesso: false, erro: `Produto com ID ${id} não encontrado` });
        return;
      }

      const removido = produtos.splice(index, 1)[0];
      await salvarProdutos(produtos);

      const resposta: ApiResponse<Produto> = { sucesso: true, dados: removido };
      res.json(resposta);
    } catch {
      res.status(500).json({ sucesso: false, erro: "Erro ao remover produto" });
    }
  }
);

// ============================================================
// ROTA DO FORMULÁRIO HTML (Aula 12)
// ============================================================

// POST /produtos/cadastrar — Recebe dados do formulário (urlencoded)
app.post(
  "/produtos/cadastrar",
  async (req: Request, res: Response) => {
    try {
      const { nome, categoria } = req.body;
      const preco = Number(req.body.preco);
      const estoque = Number(req.body.estoque);

      // Validação simples
      if (!nome || isNaN(preco) || preco <= 0 || isNaN(estoque) || estoque < 0) {
        res.redirect("/pagina/cadastrar?erro=dados-invalidos");
        return;
      }

      const produtos = await carregarProdutos();
      const novoId = produtos.length > 0 ? produtos[produtos.length - 1].id + 1 : 1;

      const novoProduto: Produto = {
        id: novoId,
        nome,
        preco,
        categoria: categoria || "Outro",
        estoque,
        disponivel: estoque > 0,
      };

      produtos.push(novoProduto);
      await salvarProdutos(produtos);

      // PRG: Post-Redirect-Get (Aula 12)
      res.redirect("/pagina/produtos?sucesso=cadastrado");
    } catch {
      res.redirect("/pagina/cadastrar?erro=servidor");
    }
  }
);

// POST /produtos/:id/excluir — Excluir via formulário HTML
app.post(
  "/produtos/:id/excluir",
  async (req: Request<ProdutoParams>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const produtos = await carregarProdutos();
      const index = produtos.findIndex((p) => p.id === id);

      if (index === -1) {
        res.redirect("/pagina/produtos?erro=nao-encontrado");
        return;
      }

      produtos.splice(index, 1);
      await salvarProdutos(produtos);

      res.redirect("/pagina/produtos?sucesso=removido");
    } catch {
      res.redirect("/pagina/produtos?erro=servidor");
    }
  }
);

// ============================================================
// ROTAS DE PÁGINAS HTML (EJS) — Aulas 11 e 12
// ============================================================

// ---------- GET /pagina/produtos — Lista visual ----------
app.get(
  "/pagina/produtos",
  async (req: Request<{}, {}, {}, FiltroQuery>, res: Response) => {
    try {
      let produtos = await carregarProdutos();

      // Filtro por categoria (se vier na query)
      if (req.query.categoria) {
        produtos = produtos.filter((p) => p.categoria === req.query.categoria);
      }

      // Ordenar por nome
      produtos = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));

      // Estatísticas
      const total = produtos.length;
      const disponiveis = produtos.filter((p) => p.disponivel).length;
      const esgotados = total - disponiveis;
      const valorTotal = produtos.reduce((soma, p) => soma + p.preco * p.estoque, 0);

      res.render("produtos", {
        produtos,
        total,
        disponiveis,
        esgotados,
        valorTotal,
        mensagem: req.query.sucesso || null,
        erro: req.query.erro || null,
        categoriaFiltro: req.query.categoria || null,
      });
    } catch {
      res.status(500).render("erro", { mensagem: "Erro ao carregar produtos" });
    }
  }
);

// ---------- GET /pagina/produtos/:id — Detalhe visual ----------
app.get(
  "/pagina/produtos/:id",
  async (req: Request<ProdutoParams>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const produtos = await carregarProdutos();
      const produto = produtos.find((p) => p.id === id);

      if (!produto) {
        res.status(404).render("erro", { mensagem: `Produto com ID ${id} não encontrado` });
        return;
      }

      res.render("detalhe", { produto });
    } catch {
      res.status(500).render("erro", { mensagem: "Erro ao buscar produto" });
    }
  }
);

// ---------- GET /pagina/cadastrar — Formulário de cadastro ----------
app.get("/pagina/cadastrar", (req: Request<{}, {}, {}, { erro?: string }>, res: Response) => {
  res.render("cadastrar", {
    categorias: CATEGORIAS_VALIDAS,
    erro: req.query.erro || null,
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORTA, () => {
  console.log("=".repeat(60));
  console.log(`🛒 API Loja Virtual rodando em http://localhost:${PORTA}`);
  console.log("=".repeat(60));
  console.log("");
  console.log("Páginas (HTML):");
  console.log(`  → http://localhost:${PORTA}/`);
  console.log(`  → http://localhost:${PORTA}/pagina/produtos`);
  console.log(`  → http://localhost:${PORTA}/pagina/cadastrar`);
  console.log("");
  console.log("API (JSON):");
  console.log(`  → GET    /produtos`);
  console.log(`  → GET    /produtos?categoria=Roupa`);
  console.log(`  → GET    /produtos?disponivel=true`);
  console.log(`  → GET    /produtos/:id`);
  console.log(`  → POST   /produtos`);
  console.log(`  → PUT    /produtos/:id`);
  console.log(`  → DELETE /produtos/:id`);
  console.log("");
});
