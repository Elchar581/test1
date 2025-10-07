import { useEffect, useState, useRef } from 'react';
import { MapPin, Filter, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TrashLocation = Database['public']['Tables']['trash_locations']['Row'] & {
  project_users?: { full_name: string } | null;
};

type StatusFilter = 'all' | 'reported' | 'in_progress' | 'cleaned' | 'rejected';

declare global {
  interface Window {
    ymaps: any;
  }
}

export function MapView() {
  const [locations, setLocations] = useState<TrashLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedLocation, setSelectedLocation] = useState<TrashLocation | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetchLocations();
  }, [statusFilter]);

  useEffect(() => {
    if (window.ymaps && mapRef.current && !mapInstanceRef.current) {
      window.ymaps.ready(() => {
        const map = new window.ymaps.Map(mapRef.current, {
          center: [55.7558, 37.6173],
          zoom: 10,
          controls: ['zoomControl', 'fullscreenControl'],
        });

        mapInstanceRef.current = map;
        updateMapMarkers();
      });
    } else if (mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [locations]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trash_locations')
        .select('*, project_users(full_name)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.ymaps) return;

    mapInstanceRef.current.geoObjects.removeAll();

    locations.forEach((location) => {
      const placemark = new window.ymaps.Placemark(
        [location.latitude, location.longitude],
        {
          balloonContent: `
            <div style="padding: 8px;">
              <strong>${location.description}</strong><br/>
              <span style="color: #666;">Тип: ${getTrashTypeLabel(location.trash_type)}</span><br/>
              <span style="color: #666;">Статус: ${getStatusLabel(location.status)}</span>
            </div>
          `,
        },
        {
          preset: getMarkerPreset(location.status),
        }
      );

      placemark.events.add('click', () => {
        setSelectedLocation(location);
      });

      mapInstanceRef.current.geoObjects.add(placemark);
    });
  };

  const getMarkerPreset = (status: string) => {
    switch (status) {
      case 'reported':
        return 'islands#redIcon';
      case 'in_progress':
        return 'islands#blueIcon';
      case 'cleaned':
        return 'islands#greenIcon';
      case 'rejected':
        return 'islands#grayIcon';
      default:
        return 'islands#redIcon';
    }
  };

  const getTrashTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plastic: 'Пластик',
      metal: 'Металл',
      glass: 'Стекло',
      organic: 'Органика',
      electronic: 'Электроника',
      mixed: 'Смешанный',
      other: 'Другое',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reported: 'Сообщено',
      in_progress: 'В работе',
      cleaned: 'Очищено',
      rejected: 'Отклонено',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported':
        return <MapPin className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cleaned':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cleaned':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий',
    };
    return labels[priority] || priority;
  };

  const handleStatusChange = async (locationId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'cleaned') {
        updates.cleaned_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('trash_locations')
        .update(updates)
        .eq('id', locationId);

      if (error) throw error;

      await fetchLocations();
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              <span className="text-sm text-gray-700">Загрузка данных...</span>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Фильтр по статусу</h3>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            <option value="reported">Сообщено</option>
            <option value="in_progress">В работе</option>
            <option value="cleaned">Очищено</option>
            <option value="rejected">Отклонено</option>
          </select>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Легенда:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Сообщено</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>В работе</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Очищено</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Отклонено</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{locations.length}</div>
            <div className="text-sm text-gray-600">Всего меток</div>
          </div>
        </div>

        <div ref={mapRef} className="w-full h-full" />
      </div>

      {selectedLocation && (
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Детали метки</h3>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Описание</label>
                <p className="text-gray-900">{selectedLocation.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Тип мусора</label>
                  <p className="text-gray-900">{getTrashTypeLabel(selectedLocation.trash_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Приоритет</label>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(selectedLocation.priority)}`}>
                    {getPriorityLabel(selectedLocation.priority)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Статус</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedLocation.status)}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedLocation.status)}`}>
                    {getStatusLabel(selectedLocation.status)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Координаты</label>
                <p className="text-sm text-gray-600 font-mono">
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
              </div>

              {selectedLocation.project_users && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Пользователь</label>
                  <p className="text-gray-900">{selectedLocation.project_users.full_name}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Создано</label>
                <p className="text-sm text-gray-600">{formatDate(selectedLocation.created_at)}</p>
              </div>

              {selectedLocation.cleaned_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Очищено</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedLocation.cleaned_at)}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 block mb-2">Изменить статус</label>
                <div className="space-y-2">
                  {selectedLocation.status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(selectedLocation.id, 'in_progress')}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Взять в работу
                    </button>
                  )}
                  {selectedLocation.status !== 'cleaned' && (
                    <button
                      onClick={() => handleStatusChange(selectedLocation.id, 'cleaned')}
                      className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Отметить очищенным
                    </button>
                  )}
                  {selectedLocation.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(selectedLocation.id, 'rejected')}
                      className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Отклонить
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
