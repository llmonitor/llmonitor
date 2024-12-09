import { useProjectMutation, useProjectSWR } from ".";
import { fetcher } from "../fetcher";
import { Chart, Dashboard } from "shared/dashboards";

export function useDashboards() {
  const { data, isLoading, mutate } = useProjectSWR<Dashboard[]>("/dashboards");

  const { trigger: insert, isMutating: isInserting } = useProjectMutation(
    `/dashboards`,
    fetcher.post,
  );

  return {
    dashboards: data || [],
    isLoading,
    insert,
    isInserting,
    mutate,
  };
}

export function useDashboard(id: string) {
  const { mutate: mutateDashboards } = useDashboards();

  const {
    data: dashboard,
    isLoading,
    mutate,
  } = useProjectSWR<Dashboard>(`/dashboards/${id}`);

  const { trigger: updateMutation, isMutating } = useProjectMutation(
    `/dashboards/${id}`,
    fetcher.patch,
    { onSuccess: () => mutateDashboards() },
  );

  function update(data: Partial<Dashboard>) {
    updateMutation(data, { optimisticData: { ...dashboard, ...data } });
  }

  const { trigger: removeMutation } = useProjectMutation(
    id && `/dashboards/${id}`,
    fetcher.delete,
    {
      revalidate: false,
      onSuccess() {
        mutateDashboards();
      },
    },
  );

  return {
    dashboard,
    update,
    remove: removeMutation,
    mutate,
    isLoading,
    isMutating,
  };
}

export function useCustomCharts() {
  const { data, isLoading, mutate } = useProjectSWR<Chart[]>(
    "/dashboards/charts/custom",
  );

  const { trigger } = useProjectMutation(
    "/dashboards/charts/custom",
    fetcher.post,
  );

  async function insertCustomChart(chart: Chart) {
    await trigger(chart);
    mutate();
  }

  return {
    insert: insertCustomChart,
    customCharts: data || [],
    isLoading,
  };
}
