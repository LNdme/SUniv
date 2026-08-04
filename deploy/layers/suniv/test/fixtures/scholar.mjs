const serpapi = {
  organic_results: [
    {
      result_id: "abc123",
      title: "Attention Is All You Need",
      link: "https://papers.example/attention",
      snippet:
        "… we propose a new simple network architecture, the Transformer, based solely on attention mechanisms …",
      publication_info: { summary: "A Vaswani, N Shazeer, N Parmar - Advances in neural information, 2017" },
      inline_links: { cited_by: { total: 150000 } },
      resources: [{ title: "arxiv.org", file_format: "PDF", link: "https://arxiv.org/pdf/1706.03762" }],
    },
    {
      result_id: "def456",
      title: "A Result Whose Publication Info Has No Dash",
      link: "https://papers.example/nodash",
      snippet: "Matched text, not an abstract.",
      publication_info: { summary: "Some Institution 2020" },
      inline_links: { cited_by: { total: 4 } },
    },
    {
      result_id: "ghi789",
      title: "A Result With No Publication Info At All",
      link: "https://papers.example/bare",
      resources: [{ title: "example.com", link: "https://example.com/paper.pdf" }],
    },
  ],
};

export const routes = [{ match: "serpapi.com", body: serpapi }];
