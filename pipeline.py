from agents import build_reader_agent, build_search_agent, writer_chain, critic_chain


def run_research_pipeline(topic: str) -> dict:
    state = {}

    # search agent working

    print("\n" "+ =" * 50)
    print("Step 1 : Search Agent is working")
    print("=" * 50)

    search_agent = build_reader_agent()
    search_result = search_agent.invoke(
        {
            "messages": [
                (
                    "user",
                    f"Find recent , reliable and detailed information about : {topic}",
                )
            ]
        }
    )
    state["search_result"] = search_result["message"][-1].content
